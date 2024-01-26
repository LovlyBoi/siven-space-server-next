import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

export class Tag {
  @IsString()
  name: string;

  @IsString()
  color: string;
}

export class PublishBlogDTO {
  @IsString()
  id: string; // 文件上传的时候，服务器返回的nanoid

  @IsString()
  author: string;

  @IsString()
  type: string;

  // 嵌套对象必须使用 Type 装饰器指定类型
  @ValidateNested()
  @Type(() => Tag)
  tag: Tag;

  @IsString()
  title: string;

  @IsString({ each: true })
  pictures: string[];
}
