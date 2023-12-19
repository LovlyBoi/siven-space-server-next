import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';
import { BlogType, FindBlogDTO } from './dto/findBlogs.dto';
import { BlogsService } from './blogs.service';
import { toNumber } from 'src/utils';
import { ConfigService } from '@nestjs/config';

@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly configService: ConfigService,
  ) {}

  // 获取所有 Blog
  @Get()
  async findAll(@Query() params: FindBlogDTO) {
    if (!(params.type in BlogType)) {
      throw new HttpException(
        'Query param `type` must be a BlogType.',
        HttpStatus.BAD_REQUEST,
      );
    }
    params.ps = toNumber(params.ps);
    params.pn = toNumber(params.pn);
    return this.blogsService.findAll(params);
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
}
