import { User } from 'src/users/entities/user.entity';
import { Blog } from './blog.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'audits' })
export class Audit {
  @PrimaryColumn('varchar', { length: 32 })
  audit_id: string;

  @Column('varchar', { length: 32 })
  blog_id: string;

  @OneToOne(() => Blog, (blog) => blog.nanoid)
  blog: Blog;

  @Column('varchar', { length: 32 })
  admin_id: string;

  @ManyToOne(() => User, (user) => user.user_id)
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column('varchar', { length: 512, default: '' })
  audit_msg: string;

  @Column('datetime', { default: () => '(datetime(current_timestamp))' })
  create_date: Date;
}
