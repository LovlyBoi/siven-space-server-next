import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { nanoid } from 'nanoid';

import { BlogType, BlogTypeSet } from './dto/findBlogs.dto';
import { BlogDto } from './dto/blogs.dto';
import { PublishBlogDTO } from './dto/publishBlog.dto';
import { BlogsService } from './blogs.service';
import { toNumber } from 'src/utils';
import { Blog } from './entities/blog.entity';

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
      ps: ps,
      pn: pn,
      type: type as BlogType,
    };

    const [blogs, hasNext] = await Promise.all([
      this.blogsService.selectAllBlogs(param),
      this.blogsService.hasNext(param),
    ]);

    console.log(blogs, hasNext);

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

  // 获取作者发布的文章
  @Get('/author/:authorId')
  async getBlogsByAuthor(
    @Param('authorId') authorId: string,
    @Query('ps') ps?: string,
    @Query('pn') pn?: string,
  ) {
    if (authorId == null || authorId === '') {
      throw this.noParamException('authorId');
    }

    let cards: Blog[], hasNext: boolean;

    if (!ps || !pn) {
      cards = await this.blogsService.selectBlogsByAuthor(authorId);
      hasNext = false;
    } else {
      const [blogs, _hasNext] = await Promise.all([
        this.blogsService.selectBlogsByAuthor(
          authorId,
          toNumber(ps),
          toNumber(pn),
        ),
        this.blogsService.hasNext({
          ps: toNumber(ps),
          pn: toNumber(pn),
        }),
      ]);
      cards = blogs;
      hasNext = _hasNext;
    }

    return {
      cards: cards.map((b) => BlogDto.fromBlogEntity(b)),
      hasNext,
    };
  }

  // 发布博客
  @Put('/')
  async publishBlog(@Body() blog: PublishBlogDTO) {
    const b = {
      id: blog.id,
      author: blog.author,
      type: 1,
      // type: blog.type,
      tag: blog.tag,
      title: blog.title,
      pictutres: blog.pictures.join(' '),
    };

    await this.blogsService.addBlog(b);
    return '发布成功';
  }
}
