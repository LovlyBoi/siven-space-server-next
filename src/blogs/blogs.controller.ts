import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  HttpException,
  HttpStatus,
  Param,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
  Patch,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlogType, BlogTypeSet } from './dto/findBlogs.dto';
import { BlogDTO } from './dto/blogs.dto';
import { PublishBlogDTO } from './dto/publishBlog.dto';
import { BlogsService } from './blogs.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuditBlogDTO } from './dto/auditBlog.dto';
import { UpdateBlogDTO } from './dto/updateBlog.dto';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly configService: ConfigService,
  ) {}

  noParamException(paramName: string) {
    return new HttpException(
      `Param \`${paramName}\` can not be empty.`,
      HttpStatus.BAD_REQUEST,
    );
  }

  // 获取所有 Blog
  @Get()
  async getBlogs(
    @Query('type') type?: BlogType,
    @Query('ps') ps?: number,
    @Query('pn') pn?: number,
    @Query('author') authorId?: string,
  ) {
    return this.selectAllBlogs(ps, pn, type, authorId, false);
  }

  async selectAllBlogs(
    ps?: number,
    pn?: number,
    type?: BlogType,
    authorId?: string,
    audit = false,
  ) {
    // 检查type
    if (!type) type = 'all';

    if (!BlogTypeSet.has(type as BlogType)) {
      throw new HttpException(
        `Query param \`type\` must be a BlogType.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const param = {
      ps: Number.isNaN(ps) ? undefined : ps,
      pn: Number.isNaN(pn) ? undefined : pn,
      type: type as BlogType,
      authorId,
      audit,
    };

    const [blogs, hasNext] = await Promise.all([
      this.blogsService.selectAllBlogs(param),
      this.blogsService.hasNext(param),
    ]);

    return {
      cards: blogs.map((b) => BlogDTO.fromBlogEntity(b)),
      hasNext,
    };
  }

  // 获取博客正文
  @Get('/html/:id')
  async getBlogHtml(@Param('id') id: string) {
    if (id == null || id === '') throw this.noParamException('id');

    // 查看有没有博客信息
    const [blogInfo, parsed] = await Promise.all([
      this.blogsService.selectBlogById(id),
      this.blogsService.getBlogHtml(id),
    ]);

    return {
      parsed,
      ...blogInfo,
    };
  }

  // 获取博客正文
  @Get('/markdown/:id')
  @UseGuards(AuthGuard)
  async getBlogMarkdown(
    @Param('id') blogId: string,
    @Req() { user: tokenInfo },
  ) {
    if (blogId == null || blogId === '') throw this.noParamException('id');

    await this.blogsService.checkBlogInfoExistAndAuthorId(blogId, tokenInfo);

    return this.blogsService.getBlogMarkdown(blogId);
  }

  // 发布博客
  @Put('/')
  async publishBlog(@Body() blog: PublishBlogDTO) {
    const b = {
      id: blog.id,
      author: blog.author,
      type: blog.type,
      tag: {
        name: blog.tagName,
        color: blog.tagColor,
      },
      title: blog.title,
      pictutres: blog.pictures.join(' '),
    };

    await this.blogsService.addBlog(b);
    return '发布成功';
  }

  // 删除博客
  @Delete('/:id')
  @UseGuards(AuthGuard)
  async deleteBlog(@Param('id') blogId: string, @Req() { user: tokenInfo }) {
    await this.blogsService.checkBlogInfoExistAndAuthorId(blogId, tokenInfo);

    await this.blogsService.deleteBlog(blogId);
    return '删除成功';
  }

  // 更新博客信息
  @Patch('/:id')
  @UseGuards(AuthGuard)
  async updateBlog(
    @Param('id') blogId: string,
    @Req() { user: tokenInfo },
    @Body() blog: UpdateBlogDTO,
  ) {
    await this.blogsService.checkBlogInfoExistAndAuthorId(blogId, tokenInfo);

    await this.blogsService.updateBlog(blogId, {
      type: blog.type,
      tag: {
        name: blog.tagName,
        color: blog.tagColor,
      },
      title: blog.title,
      pictutres: blog.pictures.join(' '),
    });
    return '更新成功';
  }

  // 上传Markdown原文
  @Post('/upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async storeMarkdown(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('上传失败', HttpStatus.BAD_REQUEST);
    } else if (file.mimetype !== 'text/markdown') {
      throw new HttpException(
        'The mime type must be markdown.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const id = await this.blogsService.storeMarkdown(file);
    return { id };
  }

  // Markdown原文重新上传（更新）
  @Post('upload/:id')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard)
  async updateStoreMarkdown(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') blogId: string,
    @Req() { user: tokenInfo },
  ) {
    const blogInfo = await this.blogsService.selectBlogById(blogId);

    const { id, role } = tokenInfo;

    // 数据库里没有博客信息
    if (!blogInfo) {
      throw new HttpException('The blog does not exist.', HttpStatus.NOT_FOUND);
    } else if (blogInfo.author.user_id !== id && role !== 3) {
      // 不是作者，也不是超管
      throw new HttpException(
        'You are not the author of this blog.',
        HttpStatus.FORBIDDEN,
      );
    } else if (!this.blogsService.isMarkdownExist(blogId)) {
      // 缓存里面没有Markdown原文
      throw new HttpException(
        'The markdown file does not exist.',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.blogsService.deleteMarkdown(blogId);
    await this.blogsService.storeMarkdown(file, blogId);
    // 更新博客编辑时间（不需要等他完成）
    this.blogsService.updateBlogUpdateDate(blogId);

    return { id: blogId };
  }

  // 获取待审核文章
  @Get('/audit')
  @UseGuards(AuthGuard)
  async getAuditingBlogs(
    @Req() { user: tokenInfo },
    @Query('type') type?: BlogType,
    @Query('ps') ps?: number,
    @Query('pn') pn?: number,
    @Query('author') authorId?: string,
  ) {
    const { role } = tokenInfo;

    // 不是管理员
    if (role !== 2 && role !== 3)
      throw new HttpException('You are not an admin.', HttpStatus.FORBIDDEN);

    return this.selectAllBlogs(ps, pn, type, authorId, true);
  }

  // 审核文章
  @Patch('/audit/:id')
  @UseGuards(AuthGuard)
  async auditBlog(
    @Req() { user: tokenInfo },
    @Param('id') blogId: string,
    @Body() { state, msg }: AuditBlogDTO,
  ) {
    const { role, id } = tokenInfo;

    // 不是管理员
    if (role !== 2 && role !== 3)
      throw new HttpException('You are not an admin.', HttpStatus.FORBIDDEN);

    const blog = await this.blogsService.selectBlogById(blogId);

    if (!blog) {
      // 没有博客
      throw new HttpException('The blog does not exist.', HttpStatus.NOT_FOUND);
    }

    await this.blogsService.auditBlog(blogId, id, state, msg);
    return 'ok';
  }
}
