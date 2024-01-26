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
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlogType, BlogTypeSet } from './dto/findBlogs.dto';
import { BlogDto } from './dto/blogs.dto';
import { PublishBlogDTO } from './dto/publishBlog.dto';
import { BlogsService } from './blogs.service';
import { AuthGuard } from 'src/auth/auth.guard';
// import { TokenInfo } from './types';
import { FileInterceptor } from '@nestjs/platform-express';

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
    @Query('audit') audit?: boolean,
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
      cards: blogs.map((b) => BlogDto.fromBlogEntity(b)),
      hasNext,
    };
  }

  // 获取博客正文
  @Get('/html/:id')
  async getBlogHtml(@Param('id') id: string) {
    if (id == null || id === '') {
      throw this.noParamException('id');
    }

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
    if (blogId == null || blogId === '') {
      throw this.noParamException('id');
    }

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
      tag: blog.tag,
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

    if (!blogInfo) {
      // 数据库里没有博客信息
      throw new HttpException('The blog does not exist.', HttpStatus.NOT_FOUND);
    } else if (blogInfo.author.user_id !== id && role !== 2) {
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

    return { id: blogId };
  }
}
