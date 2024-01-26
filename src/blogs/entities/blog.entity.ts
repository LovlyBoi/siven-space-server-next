import { User } from 'src/users/entities/user.entity';
import { Audit } from './audit.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';

@Entity({ name: 'blogs' })
export class Blog {
  @PrimaryColumn('varchar', { length: 32 })
  nanoid: string;

  @ManyToOne(() => User, (user) => user.user_name)
  @JoinColumn({ name: 'author' })
  author: User;

  @Column('varchar', { length: 32 })
  type: string;

  @Column('varchar', { length: 80 })
  title: string;

  @Column('varchar', { length: 1020 })
  pics: string;

  @Column('varchar', { length: 30 })
  tag_name: string;

  @Column('varchar', { length: 30 })
  tag_color: string;

  @Column('int', { default: 0 })
  reading_volume: number;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  publish_date: number;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  update_date: number;

  @Column('tinyint', { default: 0 })
  unuse: number;

  @Column('tinyint', { default: 1 })
  audit: number;

  @Column('varchar', { length: 32 })
  audit_id: string;

  @OneToOne(() => Audit, (audit) => audit.blog)
  @JoinColumn({ name: 'audit_id' })
  auditRecord: Audit;
}
