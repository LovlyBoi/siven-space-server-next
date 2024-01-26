import { Audit } from 'src/blogs/entities/audit.entity';
import { Blog } from 'src/blogs/entities/blog.entity';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn('varchar', { length: 32 })
  user_id: string;

  // 指向Blogs关系，并不是真的一列
  @OneToMany(() => Blog, (blog) => blog.author)
  blogs: Blog[];

  @OneToMany(() => Audit, (audit) => audit.admin)
  audits: Audit[];

  @Column('varchar', { length: 32 })
  user_name: string;

  @Column('varchar', { length: 128 })
  password: string;

  @Column('tinyint', { default: 1 })
  role: number;

  @Column('varchar', { length: 512 })
  avatar: string;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  create_date: number;

  @Column('tinyint', { default: 0 })
  unuse: number;
}
