import { IsString } from 'class-validator';

// 博客类型
const BlogTypes = [
  'all',
  'front-end-tec',
  'node',
  'math',
  'life',
  'back-end-tec',
  'other-tec',
] as const;

export const BlogTypeSet = new Set(BlogTypes);

export type BlogType = (typeof BlogTypes)[number];

export class FindBlogDTO {
  @IsString()
  type: string;
  readonly from?: string;
  @IsString()
  ps: string | number = '10';
  @IsString()
  pn: string | number = '1';
}
