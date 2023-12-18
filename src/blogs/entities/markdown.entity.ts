import { HeadingData } from 'marked-gfm-heading-id';

export type Outline = HeadingData[];

export type ParsedHtml = {
  outline: Outline;
  html: string | Buffer;
};
