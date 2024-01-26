import { User } from '../entities/user.entity';

export class UserInfoDTO {
  id: string;
  username: string;
  role: number;
  avatar: string;
  createDate: Date;

  constructor(
    id: string,
    username: string,
    role: number,
    avatar: string,
    createDate: Date,
  ) {
    this.id = id;
    this.username = username;
    this.role = role;
    this.avatar = avatar;
    this.createDate = createDate;
  }

  static fromUserEntity(user: User) {
    return new UserInfoDTO(
      user.user_id,
      user.user_name,
      user.role,
      user.avatar,
      user.create_date as unknown as Date,
    );
  }
}
