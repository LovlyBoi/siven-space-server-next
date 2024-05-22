import {
  HttpException,
  HttpStatus,
  Injectable,
  StreamableFile,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  getMarkdown,
  removeCache,
  writeMarkdown,
  isMarkDownExist as isMarkDownExistUtil,
  removeMarkdown,
  isMarkDownExist,
  getHtmlStreamById,
} from 'src/utils';
import { Blog } from './entities/blog.entity';
import { BlogType } from './dto/findBlogs.dto';
import { User } from 'src/users/entities/user.entity';
import { TokenInfo } from './types';
import { nanoid } from 'nanoid';
import { Audit } from './entities/audit.entity';

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

// 更新博客信息，不需要id和作者
type UpdateBlogParam = Omit<PublishBlogParam, 'id' | 'author'>;

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
    'blog.audit',
  ];

  private readonly logger = new Logger(BlogsService.name);

  // 查询全部Blog
  constructor(
    @InjectRepository(Blog)
    private readonly blogsRepository: Repository<Blog>,
    @InjectRepository(Audit)
    private readonly auditRepository: Repository<Audit>,
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
      if (type === '@essays') {
        queryBuilder = queryBuilder.andWhere('blog.type = :type', {
          type: 'life',
        });
      } else if (type === '@notes') {
        queryBuilder = queryBuilder.andWhere('blog.type != :type', {
          type: 'life',
        });
      } else {
        queryBuilder = queryBuilder.andWhere('blog.type = :type', { type });
      }
    }

    if (authorId) {
      queryBuilder = queryBuilder.andWhere('blog.author = :authorId', {
        authorId,
      });
    }

    if (audit != null) {
      queryBuilder = queryBuilder.andWhere('blog.audit = :audit', {
        // 0:待审核 1:审核通过 2:审核不通过
        audit: audit ? 1 : 0,
      });
    }

    queryBuilder = queryBuilder.orderBy('blog.update_date', 'DESC');
    console.log(queryBuilder.getSql());

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
  selectBlogById(blogId: string) {
    return this.blogsRepository.findOne({
      where: { nanoid: blogId, unuse: 0 },
      relations: ['author'],
      select: [
        'nanoid',
        'author',
        'type',
        'title',
        'pics',
        'tag_name',
        'tag_color',
        'publish_date',
        'update_date',
        'audit',
      ],
    });
  }

  // 查找博客个数
  async selectBlogsCount(type?: BlogType) {
    return this.blogsRepository.count({
      where: { unuse: 0, audit: 0, type: type === 'all' ? undefined : type },
    });
  }

  // 查看还有没有后续的博客
  async hasNext({ ps, pn, type }: HandledParams) {
    const current = ps * pn;
    const total = await this.selectBlogsCount(type);
    return current < total;
  }

  // 获取博客markdown
  async getBlogMarkdown(blogId: string): Promise<StreamableFile> {
    const stream = getMarkdown(blogId);
    if (!stream)
      throw new HttpException(
        `Can not get file ${blogId}.`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    return new StreamableFile(stream);
  }

  // 获取博客html
  async getBlogHtml(blogId: string) {
    if (!isMarkDownExist(blogId)) {
      throw new HttpException(
        'This Blog does not exist.',
        HttpStatus.NOT_FOUND,
      );
    }

    return getHtmlStreamById(blogId);
  }

  // 添加新博客
  async addBlog(blog: PublishBlogParam) {
    // 先看一下有没有该id
    const existed = await this.selectBlogById(blog.id);

    if (existed) {
      throw new HttpException(
        'The blog id already exists.',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const result = await this.blogsRepository
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

    this.logger.log(`Added new blog info, id ${blog.id}`);

    return result;
  }

  async checkBlogInfoExistAndAuthorId(blogId: string, tokenInfo: TokenInfo) {
    const blog = await this.selectBlogById(blogId);

    if (blog == null) {
      throw new HttpException(
        `Can not get blog \`${blogId}\``,
        HttpStatus.NOT_FOUND,
      );
    } else if (tokenInfo.role !== 3 && blog.author.user_id !== tokenInfo.id) {
      throw new HttpException(
        'You are not the author of this blog.',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  // 删除博客
  async deleteBlog(blogId: string) {
    // 移除相关的缓存文件(但不移除markdown文件)
    this.removeMarkdownCache(blogId);

    const result = await this.blogsRepository
      .createQueryBuilder()
      .update(Blog)
      .set({ unuse: 1 })
      .where('nanoid = :id', { id: blogId })
      .execute();

    this.logger.log(`Delete blog ${blogId}`);

    return result;
  }

  // 更新博客信息
  async updateBlog(blogId: string, blog: UpdateBlogParam) {
    const result = this.blogsRepository.update(
      { nanoid: blogId },
      {
        type: blog.type,
        title: blog.title,
        pics: blog.pictutres,
        tag_name: blog.tag.name,
        tag_color: blog.tag.color,
        // 需要重新审核
        audit: 1,
        update_date: () => '(datetime(current_timestamp))',
      },
    );

    this.logger.log(`Update blog ${blogId}`);

    return result;
  }

  // 更新博客更新时间，并重新提交审核
  async updateBlogUpdateDate(blogId: string) {
    return this.blogsRepository.update(
      { nanoid: blogId },
      {
        audit: 1,
        update_date: () => '(datetime(current_timestamp))',
      },
    );
  }

  // 存储Markdown原文
  async storeMarkdown(file: Express.Multer.File, blogId = nanoid()) {
    await writeMarkdown(blogId, file);

    this.logger.log(
      `Store markdown file ${blogId}, originalName ${file.originalname}`,
    );

    return blogId;
  }

  // 判断Markdown原文是否存在
  isMarkdownExist(blogId: string) {
    return isMarkDownExistUtil(blogId);
  }

  // 删除Markdown原文（只有重新上传的时候会删除原文）
  deleteMarkdown(blogId: string) {
    this.removeMarkdownCache(blogId);

    return removeMarkdown(blogId);
  }

  // 移除Markdown缓存（HTML、Outline）
  removeMarkdownCache(blogId: string) {
    return removeCache(blogId);
  }

  // 审核文章
  async auditBlog(
    blogId: string,
    managerId: string,
    state: boolean,
    msg?: string,
  ) {
    const auditId = await this.createAuditRecord(blogId, managerId, msg);
    return this.blogsRepository.update(
      { nanoid: blogId },
      { audit_id: auditId, audit: state ? 0 : 1 },
    );
  }

  // 创建审核记录
  async createAuditRecord(blogId: string, managerId: string, msg = '') {
    const auditId = nanoid();

    this.auditRepository.insert({
      audit_id: auditId,
      blog_id: blogId,
      admin_id: managerId,
      audit_msg: msg,
    });

    return auditId;
  }
}
