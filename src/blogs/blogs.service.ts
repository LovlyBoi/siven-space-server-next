import {
  HttpException,
  HttpStatus,
  Injectable,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogType, FindBlogDTO } from './dto/findBlogs.dto';
import { getHtmlById, getMarkdown } from './utils';
import { BlogEntity } from './entities/blog.entity';
import { BlogDto } from './dto/blogs.dto';

@Injectable()
export class BlogsService {
  // 查询全部Blog
  findAllBlogSql = `
    SELECT
      nanoid,
      users.user_name as author,
      type,
      title,
      pics,
      tag_name,
      tag_color,
      publish_date,
      update_date
    FROM
      blogs
      INNER JOIN users ON users.user_id = blogs.author
    WHERE
      blogs.unuse = 0
      AND blogs.audit = 0
    ORDER BY
      update_date DESC
    LIMIT
      ? OFFSET ?;`;

  // 按照type查询Blog
  findBlogByTypeSql = `
    SELECT
      nanoid,
      users.user_name,
      type,
      title,
      pics,
      tag_name,
      tag_color,
      publish_date,
      update_date
    FROM
      blogs
      INNER JOIN users ON users.user_id = blogs.author
    WHERE
      blogs.type = ?
      AND blogs.unuse = 0
      AND blogs.audit = 0
    ORDER BY
      update_date DESC
    LIMIT
      ? OFFSET ?;`;

  // 按照id查询Blog
  findBlogByIdSql = `
    SELECT
      nanoid as id,
      users.user_name as author,
      type,
      title,
      pics as pictures,
      audit,
      JSON_OBJECT("name", tag_name, "color", tag_color) as tag,
      publish_date as publishDate,
      update_date as updateDate
    FROM
      blogs
      INNER JOIN users ON users.user_id = blogs.author
    WHERE
      blogs.nanoid = ?
      AND blogs.unuse = 0;`;
  constructor(
    @InjectRepository(BlogEntity)
    private readonly blogsRepository: Repository<BlogEntity>,
  ) {}

  async findAll(params: FindBlogDTO) {
    const sql =
      params.type === 'all' ? this.findAllBlogSql : this.findBlogByTypeSql;

    const queryParams =
      params.type === 'all'
        ? [params.ps, params.pn]
        : [BlogType[params.type], params.ps, params.pn];

    const blogs = (await this.blogsRepository.query(
      sql,
      queryParams,
    )) as BlogEntity[];
    return blogs.map((b) => BlogDto.fromBlogEntity(b));
  }

  async findOne(id: string) {
    if (id == null || id === '') {
      throw new HttpException(
        'Param `id` can not be empty.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const [blog] = (await this.blogsRepository.query(this.findBlogByIdSql, [
      id,
    ])) as BlogEntity[];
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
