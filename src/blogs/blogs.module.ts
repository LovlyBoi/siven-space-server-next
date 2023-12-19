import { Module } from '@nestjs/common';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { ConfigService } from '@nestjs/config';
import { cacheInit } from './utils/index';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogEntity } from './entities/blog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlogEntity])],
  controllers: [BlogsController],
  providers: [BlogsService],
})
export class BlogsModule {
  constructor(private readonly configService: ConfigService) {
    cacheInit(this.configService.get('CACHE_DIR'));
  }
}
