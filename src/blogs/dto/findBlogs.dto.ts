import { IsString } from 'class-validator';

// 博客类型
export enum BlogType {
  'all',
  'front-end-tec',
  'node',
  'math',
  'life',
  'back-end-tec',
  'other-tec',
}

export class FindBlogDTO {
  @IsString()
  type: string | BlogType;
  readonly from?: string;
  @IsString()
  ps: string | number = '10';
  @IsString()
  pn: string | number = '1';
}
