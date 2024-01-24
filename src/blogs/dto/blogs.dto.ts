import { Blog } from '../entities/blog.entity';

export class BlogDto {
  id: string;
  author: string;
  tag: {
    name: string;
    color: string;
  };
  publishDate: Date;
  updateDate: Date;
  title: string;
  pictures: string[];

  constructor(
    id: string,
    author: string,
    tag: {
      name: string;
      color: string;
    },
    publishDate: Date,
    updateDate: Date,
    title: string,
    pictures: string[],
  ) {
    this.id = id;
    this.author = author;
    this.tag = tag;
    this.publishDate = publishDate;
    this.updateDate = updateDate;
    this.title = title;
    this.pictures = pictures;
  }

  static fromBlogEntity(blog: Blog) {
    return new BlogDto(
      blog.nanoid,
      blog.author.user_name,
      {
        name: blog.tag_name,
        color: blog.tag_color,
      },
      blog.publish_date as unknown as Date,
      blog.update_date as unknown as Date,
      blog.title,
      blog.pics.split(' '),
    );
    // return {
    //   id: blog.nanoid,
    //   author: blog.author,
    //   tag: {
    //     name: blog.tag_name,
    //     color: blog.tag_color,
    //   },
    //   publishDate: blog.publish_date,
    //   updateDate: blog.update_date,
    //   title: blog.title,
    //   pictures: blog.pics.split(' '),
    // };
  }
}
