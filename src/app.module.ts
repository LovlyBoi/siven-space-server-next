import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogsModule } from './blogs/blogs.module';
import { UsersModule } from './users/users.module';
import { ImageModule } from './image/image.module';

@Module({
  imports: [
    BlogsModule,
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        process.env.RUNNING_ENV === 'development'
          ? '.env.develop'
          : '.env.product',
        '.env',
      ],
    }),
    // TypeOrmModule.forRoot({
    //   type: 'mysql',
    //   host: process.env.DB_HOST,
    //   username: process.env.DB_USERNAME,
    //   password: process.env.DB_PASSWORD,
    //   database: process.env.DB_DATABASE,
    //   autoLoadEntities: true,
    //   cache: true,
    //   // synchronize: process.env.RUNNING_ENV === 'development',
    // }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      // username: process.env.DB_USERNAME,
      // password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      cache: true,
      // synchronize: process.env.RUNNING_ENV === 'development',
    }),
    UsersModule,
    ImageModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: AppService,
      useClass: AppService,
    },
  ],
})
export class AppModule {}
