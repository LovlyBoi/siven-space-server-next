import { IsString } from 'class-validator';

export class UpdateBlogDTO {
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
