import {
  HttpException,
  HttpStatus,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getHtmlById, getMarkdown } from './utils';
import { Blog } from './entities/blog.entity';
import { BlogType } from './dto/findBlogs.dto';

type HandledParams = {
  ps: number;
  pn: number;
  type?: BlogType;
};

@Injectable()
export class BlogsService {
  blogSelector = [
    'blog.nanoid',
    'user.user_name as blog_author',
    'blog.type',
    'blog.title',
    'blog.pics',
    'blog.tag_name',
    'blog.tag_color',
    'blog.publish_date',
    'blog.update_date',
  ];

  // 查询全部Blog
  constructor(
    @InjectRepository(Blog)
    private readonly blogsRepository: Repository<Blog>,
  ) {}

  // 查询所有博客数据
  selectAllBlogs(ps: number, pn: number) {
    return this.blogsRepository
      .createQueryBuilder('blog')
      .select(this.blogSelector)
      .innerJoinAndSelect('users', 'user', 'user.user_id = blog.author_id')
      .where('blog.unuse = :unuse', { unuse: 0 })
      .andWhere('blog.audit = :audit', { audit: 0 })
      .orderBy('update_date', 'DESC')
      .limit(ps)
      .offset(pn)
      .getMany();
  }

  // 查询某个作者的所有博客数据
  selectBlogsByAuthor(authorId: string) {
    return this.blogsRepository
      .createQueryBuilder('blog')
      .select(this.blogSelector)
      .innerJoinAndSelect('users', 'user', 'user.user_id = blog.author_id')
      .where('blog.unuse = :unuse', { unuse: 0 })
      .andWhere('blog.author_id = :authorId', { authorId })
      .orderBy('update_date', 'DESC')
      .getMany();
  }

  seleBlogById(id: string) {
    return this.blogsRepository
      .createQueryBuilder('blog')
      .select(this.blogSelector)
      .innerJoinAndSelect('users', 'user', 'user.user_id = blog.author_id')
      .where('blog.nanoid = :nanoid', { nanoid: id })
      .andWhere('blog.unuse = :unuse', { unuse: 0 })
      .getOne();
  }

  async selectBlogsCount(type?: BlogType) {
    const sqlBuilder = this.blogsRepository
      .createQueryBuilder('blog')
      .select('count(blog.nanoid) as count')
      .where('blog.unuse = :unuse', { unuse: 0 })
      .andWhere('blog.audit = :audit', { audit: 0 });

    const { count } = await (type
      ? sqlBuilder
          .andWhere('blog.type = :type', { type })
          .getRawOne<{ count: number }>()
      : sqlBuilder.getRawOne<{ count: number }>());

    return count;
  }

  // 查看还有没有后续的博客
  async hasNext({ ps, pn, type }: HandledParams) {
    const current = ps * pn;
    const total = await this.selectBlogsCount(type);
    return current < total;
  }

  async findAll({ ps, pn }: HandledParams) {
    const blogs = await this.selectAllBlogs(ps, pn);

    return blogs;
  }

  async findOne(id: string) {
    if (id == null || id === '') {
      throw new HttpException(
        'Param `id` can not be empty.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const blog = await this.seleBlogById(id);
    return blog;
  }

  // 获取博客markdown
  async getBlogMarkdown(id: string): Promise<StreamableFile> {
    const stream = getMarkdown(id);
    if (!stream)
      throw new HttpException(
        `Can not get file ${id}.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    return new StreamableFile(stream);
  }

  // 获取博客html
  async getBlogHtml(id: string) {
    const parsed = await getHtmlById(id);
    return {
      parsed,
    };
  }
}
