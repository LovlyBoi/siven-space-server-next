import { Body, Controller, Post, Put } from '@nestjs/common';
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
}
