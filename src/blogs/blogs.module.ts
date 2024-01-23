import { Module } from '@nestjs/common';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { ConfigService } from '@nestjs/config';
import { cacheInit } from './utils/index';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Blog, User])],
  controllers: [BlogsController],
  providers: [BlogsService],
})
export class BlogsModule {
  constructor(private readonly configService: ConfigService) {
    cacheInit(this.configService.get('CACHE_DIR'));
  }
}
