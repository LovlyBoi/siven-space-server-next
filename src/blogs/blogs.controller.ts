import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlogType, BlogTypeSet } from './dto/findBlogs.dto';
import { BlogDto } from './dto/blogs.dto';
import { PublishBlogDTO } from './dto/publishBlog.dto';
import { BlogsService } from './blogs.service';
import { AuthGuard } from 'src/auth/auth.guard';

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
  async getBlogMarkdown(@Param('id') id: string) {
    if (id == null || id === '') {
      throw this.noParamException('id');
    }
    // 查看有没有博客信息
    const blog = await this.blogsService.selectBlogById(id);
    if (blog == null) {
      throw new HttpException(
        `Can not get blog \`${id}\``,
        HttpStatus.NOT_FOUND,
      );
    }
    return this.blogsService.getBlogMarkdown(id);
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
  async deleteBlog(
    @Param('id') blogId: string,
    @Query('_tokenInfo') tokenInfo,
  ) {
    await this.blogsService.deleteBlog(blogId, tokenInfo);
    return '删除成功';
  }
}
