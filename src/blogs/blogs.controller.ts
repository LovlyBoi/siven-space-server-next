import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlogType, BlogTypeSet, FindBlogDTO } from './dto/findBlogs.dto';
import { BlogDto } from './dto/blogs.dto';
import { BlogsService } from './blogs.service';
import { toNumber } from 'src/utils';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly configService: ConfigService,
  ) {}

  // 获取所有 Blog
  @Get()
  async getBlogs(@Query() params: FindBlogDTO) {
    // 检查type
    if (!BlogTypeSet.has(params.type as BlogType)) {
      throw new HttpException(
        'Query param `type` must be a BlogType.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const p = {
      ps: toNumber(params.ps),
      pn: toNumber(params.pn),
      type: params.type as BlogType,
    };

    const blogsDto = (await this.blogsService.findAll(p)).map((b) =>
      BlogDto.fromBlogEntity(b),
    );

    const hasNext = await this.blogsService.hasNext(p);

    return {
      cards: blogsDto,
      hasNext,
    };
  }

  // 获取博客正文
  @Get('/html/:id')
  async getBlogHtml(@Param('id') id: string) {
    // 查看有没有博客信息
    const blogInfo = await this.blogsService.findOne(id);
    return {
      parsed: await this.blogsService.getBlogHtml(id),
      ...blogInfo,
    };
  }

  // 获取博客正文
  @Get('/markdown/:id')
  async getBlogMarkdown(@Param('id') id: string) {
    // 查看有没有博客信息
    await this.blogsService.findOne(id);
    return this.blogsService.getBlogMarkdown(id);
  }

  // 获取作者发布的文章
  @Get('/author/:authorId')
  async getBlogsByAuthor(@Param('authorId') id: string) {
    if (id == null || id === '') {
      throw new HttpException('authorId is required.', HttpStatus.BAD_REQUEST);
    }
    return this.blogsService.selectBlogsByAuthor(id);
  }
}
