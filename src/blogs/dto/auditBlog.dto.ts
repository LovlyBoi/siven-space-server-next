import { IsBoolean } from 'class-validator';

export class AuditBlogDTO {
  @IsBoolean()
  state: boolean;

  msg?: string;
}
