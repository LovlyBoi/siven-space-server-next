import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { CacheControlInterceptor } from './cacheControl.interceptor';

async function bootstrap() {
  const __IS_DEV = process.env.RUNNING_ENV === 'development';
  const app = await NestFactory.create(AppModule, { cors: __IS_DEV });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换dto传入类型
    }),
  );

  // app.useGlobalInterceptors(new CacheControlInterceptor());

  app.listen(process.env.APP_PORT);
}

bootstrap();
