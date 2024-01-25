import {
  HttpException,
  HttpStatus,
  Injectable,
  StreamableFile,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getHtmlById, getMarkdown } from './utils';
import { Blog } from './entities/blog.entity';
import { BlogType } from './dto/findBlogs.dto';
import { User } from 'src/users/entities/user.entity';

type HandledParams = {
  ps?: number;
  pn?: number;
  type: BlogType;
  authorId?: string;
  audit?: boolean;
};

// 发布博客 service 使用的参数类型
type PublishBlogParam = {
  id: string;
  author: string;
  type: string;
  tag: {
    name: string;
    color: string;
  };
  title: string;
  pictutres: string;
};

@Injectable()
export class BlogsService {
  blogSelector = [
    'blog.nanoid',
    'blog.author',
    'blog.type',
    'blog.title',
    'blog.pics',
    'blog.tag_name',
    'blog.tag_color',
    'blog.publish_date',
    'blog.update_date',
  ];

  private readonly logger = new Logger(BlogsService.name);

  // 查询全部Blog
  constructor(
    @InjectRepository(Blog)
    private readonly blogsRepository: Repository<Blog>,
  ) {}

  // 查询所有博客数据
  async selectAllBlogs({ ps, pn, type, authorId, audit }: HandledParams) {
    let queryBuilder = this.blogsRepository
      .createQueryBuilder('blog')
      .select(this.blogSelector)
      .innerJoinAndSelect('blog.author', 'user')
      .where('blog.unuse = :unuse', { unuse: 0 });

    if (type !== 'all') {
      // 查的不是全部，指定类型
      queryBuilder = queryBuilder.andWhere('blog.type = :type', { type });
    }

    if (authorId) {
      queryBuilder = queryBuilder.andWhere('blog.author = :authorId', {
        authorId,
      });
    }

    if (audit != null) {
      queryBuilder = queryBuilder.andWhere('blog.audit = :audit', {
        audit: audit ? 1 : 0,
      });
    }

    queryBuilder = queryBuilder.orderBy('blog.update_date', 'DESC');

    if (ps == null || pn == null || ps < 1 || pn < 1) {
      return queryBuilder.getMany();
    } else {
      return queryBuilder
        .limit(ps)
        .offset(pn - 1)
        .getMany();
    }
  }

  // 查找某个博客信息
  selectBlogById(id: string) {
    return this.blogsRepository
      .createQueryBuilder('blog')
      .select(this.blogSelector)
      .innerJoinAndSelect('blog.author', 'user')
      .where('blog.nanoid = :nanoid', { nanoid: id })
      .andWhere('blog.unuse = :unuse', { unuse: 0 })
      .getOne();
  }

  // 查找博客个数
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

  // nanoid 是否存在
  async isBlogExist(id: string) {
    const result = await this.blogsRepository
      .createQueryBuilder('blog')
      .select(['blog.nanoid'])
      .where('blog.nanoid = :id', { id })
      .andWhere('blog.unuse = :unuse', { unuse: 0 })
      .getOne();
    return !!result;
  }

  // 添加新博客
  async addBlog(blog: PublishBlogParam) {
    // 先看一下有没有该id
    const existed = await this.isBlogExist(blog.id);

    if (existed) {
      throw new HttpException(
        'The blog id already exists.',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    return this.blogsRepository
      .createQueryBuilder()
      .insert()
      .into(Blog)
      .values([
        {
          nanoid: blog.id,
          author: blog.author as unknown as User,
          type: blog.type,
          tag_color: blog.tag.color,
          tag_name: blog.tag.name,
          title: blog.title,
          pics: blog.pictutres,
        },
      ])
      .execute();
  }

  // 删除博客
  async deleteBlog(blogId: string, tokenInfo: any) {
    const blog = await this.selectBlogById(blogId);

    if (!blog) {
      // 没有这篇文章
      throw new HttpException(
        "The blog id doesn't exist.",
        HttpStatus.NOT_ACCEPTABLE,
      );
    } else if (tokenInfo.role !== 2 && blog.author.user_id !== tokenInfo.id) {
      // 不是超管，也不是文章作者
      throw new HttpException(
        'You are not the author of this blog.',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.blogsRepository
      .createQueryBuilder()
      .update(Blog)
      .set({ unuse: 1 })
      .where('nanoid = :id', { id: blogId })
      .execute();
  }
}
