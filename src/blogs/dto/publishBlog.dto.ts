import { IsString } from 'class-validator';

export class PublishBlogDTO {
  @IsString()
  id: string; // 文件上传的时候，服务器返回的nanoid

  @IsString()
  author: string;

  @IsString()
  type: string;

  @IsString()
  tagName: string;

  @IsString()
  tagColor: string;

  @IsString()
  title: string;

  @IsString({ each: true })
  pictures: string[];
}
