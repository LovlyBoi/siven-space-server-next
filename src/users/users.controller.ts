import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from './dto/createUser.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 用户注册
  @Put('/')
  async create(@Body() userInfo: CreateUserDTO) {
    return this.usersService.createUser(userInfo);
  }

  // 用户登录
  @Post('/login')
  async register(@Body() userInfo: CreateUserDTO) {
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

  // 搜索用户
  @Get('/:idOrName')
  @UseGuards(AuthGuard)
  async searchUsers(@Param('idOrName') idOrName: string, @Req() { user }) {
    const { role } = user;
    if (role !== 2 && role !== 3) {
      throw new HttpException('You are not a manager.', HttpStatus.FORBIDDEN);
    }
    const users = await this.usersService.searchUser(idOrName);
    return users;
  }

  // 修改用户权限
  @Patch('/role/:userId')
  @UseGuards(AuthGuard)
  async updateUserRole(
    @Param('userId') userId: string,
    @Body('newRole') newRole: number,
    @Req() { user },
  ) {
    const { role: adminRole } = user;
    const targetUser = await this.usersService.getUserInfoById(userId);

    if (!targetUser) {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }

    const { user_id: targetUserId, role: targetUserOldRole } = targetUser;

    if (adminRole === 1) {
      // 普通用户，不允许修改角色权限
      throw new HttpException(
        'You are not allowed to do this.',
        HttpStatus.FORBIDDEN,
      );
    } else if (adminRole === 2) {
      // 普通管理员，只允许将修改博主修改为管理员
      if (!(targetUserOldRole === 1 && newRole === 2)) {
        throw new HttpException(
          'You are not allowed to do this.',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    await this.usersService.updateUserRole(targetUserId, newRole);
    return '更新成功';
  }
}
