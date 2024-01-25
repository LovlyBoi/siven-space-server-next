import { MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @MaxLength(12)
  @MinLength(5)
  readonly username: string;

  @MaxLength(16)
  @MinLength(6)
  readonly password: string;
}
