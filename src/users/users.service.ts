import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nanoid } from 'nanoid';
import { User } from 'src/users/entities/user.entity';
import { hash, compare } from 'src/utils/bcrypt';
import { token } from 'src/utils/token';
// import { AuthGuard } from 'src/auth/auth.guard';

type UserInfo = {
  username: string;
  password: string;
};

type UserInfoTokenPayload = {
  id: string;
  username: string;
  role: number;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // 用户id是否存在
  async isUserIdExist(id: string) {
    const result = await this.usersRepository
      .createQueryBuilder('user')
      .select(['user.user_id'])
      .where('user_id = :id', { id })
      .andWhere('unuse = :unuse', { unuse: 0 })
      .getOne();
    return !!result;
  }

  // username是否存在
  async isUserNameExist(username: string) {
    const result = await this.usersRepository
      .createQueryBuilder('user')
      .select(['user.user_id'])
      .where('user_name = :username', { username })
      .andWhere('unuse = :unuse', { unuse: 0 })
      .getOne();
    return !!result;
  }

  // 获取用户信息(id)
  async getUserInfoById(id: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.user_id',
        'user.user_name',
        'user.password',
        'user.role',
        'user.avatar',
        'user.create_date',
      ])
      .where('user.user_id = :id', { id })
      .andWhere('user.unuse = :unuse', { unuse: 0 })
      .getOne();
  }

  // 获取用户信息(username)
  async getUserInfoByUserName(username: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.user_id',
        'user.user_name',
        'user.password',
        'user.role',
        'user.avatar',
        'user.create_date',
      ])
      .where('user.user_name = :username', { username })
      .andWhere('user.unuse = :unuse', { unuse: 0 })
      .getOne();
  }

  // 获取用户角色
  async getUserRole(id: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .select(['user.role'])
      .where('user.user_id = :id', { id })
      .andWhere('user.unuse = :unuse', { unuse: 0 })
      .getOne();
  }

  // 新建用户
  async createUser(userInfo: UserInfo) {
    const existed = await this.isUserNameExist(userInfo.username);

    if (existed) {
      throw new HttpException(
        'The username already exists.',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const id = nanoid();
    const hashedPassword = await hash(userInfo.password);

    await this.usersRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          user_id: id,
          user_name: userInfo.username,
          password: hashedPassword,
        },
      ])
      .execute();

    return this.withToken(await this.getUserInfoById(id));
  }

  // 用户登录
  async userLogin(userInfo: UserInfo) {
    const existed = await this.isUserNameExist(userInfo.username);

    if (!existed) {
      throw new HttpException(
        "The username doesn't exist.",
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    const user = await this.getUserInfoByUserName(userInfo.username);

    if (!(await compare(userInfo.password, user.password))) {
      throw new HttpException('Incorrect password.', HttpStatus.FORBIDDEN);
    }

    return this.withToken(user);
  }

  // 搜索用户
  async searchUser(idOrName: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.user_id',
        'user.user_name',
        'user.password',
        'user.role',
        'user.avatar',
        'user.unuse',
        'user.create_date',
      ])
      .where('user.user_name Like :idOrName', { idOrName: `%${idOrName}%` })
      .orWhere('user.user_id Like :idOrName', { idOrName: `%${idOrName}%` })
      .getMany();
  }

  // 修改用户权限
  async updateUserRole(targetUserId: string, role: number) {
    console.log(targetUserId, role);
    return this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ role })
      .where('user_id = :targetUserId', { targetUserId })
      .execute();
  }

  // 使用userinfo生成token
  async withToken(user: User) {
    const userInfo = {
      id: user.user_id,
      username: user.user_name,
      role: user.role,
    };

    return {
      userInfo,
      token: await this.generateToken(userInfo),
    };
  }

  // 生成token
  async generateToken(userInfo: UserInfoTokenPayload) {
    return {
      accessToken: await this.generateAccessToken(userInfo),
      refreshToken: await this.generateRefreshToken(userInfo),
    };
  }

  // 生成access token
  async generateAccessToken(
    userInfo: UserInfoTokenPayload,
    expHour: number = 0.25,
  ) {
    return token.signToken(
      { ...userInfo, type: 'access' },
      Math.floor(Date.now() / 1000) + 60 * 60 * expHour,
    );
  }

  // 生成refresh token
  async generateRefreshToken(
    userInfo: UserInfoTokenPayload,
    expHour: number = 24 * 1,
  ) {
    return token.signToken(
      { ...userInfo, type: 'refresh' },
      Math.floor(Date.now() / 1000) + 60 * 60 * expHour,
    );
  }

  // 检查refreshToken
  checkRefreshToken(refreshToken: string) {
    return token.verifyToken(refreshToken);
  }
}
