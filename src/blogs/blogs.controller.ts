import { Controller, Get, HttpException, Param, Query } from '@nestjs/common';
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
  findAll(@Query() params: FindBlogDTO) {
    if (!(params.type in BlogType)) {
      throw new HttpException(`${params.type} must be a BlogType.`, 400);
    }
    params.ps = toNumber(params.ps);
    params.pn = toNumber(params.pn);
    return this.blogsService.findAll(params);
  }

  // 获取博客正文
  @Get('/:id')
  findBlogContent(
    @Param('id') id: string,
    @Query('type') type: 'markdown' | 'html' = 'html',
  ) {
    type = type === 'markdown' ? 'markdown' : 'html';
    if (type === 'markdown') {
      return this.blogsService.getBlogMarkdown(id);
    } else {
      return this.blogsService.getBlogHtml(id);
    }
  }
}
