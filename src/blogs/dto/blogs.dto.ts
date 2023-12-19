import { BlogEntity } from '../entities/blog.entity';

export class BlogDto {
  id: number;
  author: string;
  tag: {
    name: string;
    color: string;
  };
  publishDate: string;
  updateDate: string;
  title: string;
  pictures: string[];

  static fromBlogEntity(blog: BlogEntity) {
    return {
      id: blog.nanoid,
      author: blog.author,
      tag: {
        name: blog.tag_name,
        color: blog.tag_color,
      },
      publishDate: blog.publish_date,
      updateDate: blog.update_date,
      title: blog.title,
      pictures: blog.pics.split(' '),
    };
  }
}
