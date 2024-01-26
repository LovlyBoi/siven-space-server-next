import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/createUser.dto';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 用户注册
  @Put('/')
  async create(@Body() userInfo: CreateUserDto) {
    return this.usersService.createUser(userInfo);
  }

  // 用户登录
  @Post('/login')
  async register(@Body() userInfo: CreateUserDto) {
    return this.usersService.userLogin(userInfo);
  }

  // 刷新token
  @Post('/refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    const [ok, payloadOrError] =
      this.usersService.checkRefreshToken(refreshToken);

    if (ok) {
      return this.usersService.generateToken({
        id: payloadOrError.id,
        username: payloadOrError.username,
        role: payloadOrError.role,
      });
    } else {
      console.log(payloadOrError);
      throw new HttpException(
        'The token cannot be resolved or the token has expired.',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
