import { Module } from '@nestjs/common';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { ConfigService } from '@nestjs/config';
import { cacheInit } from './utils/index';

@Module({
  controllers: [BlogsController],
  providers: [BlogsService],
})
export class BlogsModule {
  constructor(private readonly configService: ConfigService) {
    cacheInit(this.configService.get('CACHE_DIR'));
  }
}
