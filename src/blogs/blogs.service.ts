import { Injectable } from '@nestjs/common';
import { FindBlogDTO } from './dto/findBlogs.dto';
import { getHtmlById } from './utils';

@Injectable()
export class BlogsService {
  findAll(params: FindBlogDTO) {
    return params;
  }

  // 获取博客markdown
  async getBlogMarkdown(id: string) {
    return {
      id,
    };
  }

  // 获取博客html
  async getBlogHtml(id: string) {
    const parsed = await getHtmlById(id);
    return {
      parsed,
    };
  }
}
