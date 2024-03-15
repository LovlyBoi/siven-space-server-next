import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
// import { CacheControlInterceptor } from './cacheControl.interceptor';

async function bootstrap() {
  const __IS_DEV = process.env.RUNNING_ENV === 'development';

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { cors: __IS_DEV },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换dto传入类型
    }),
  );

  // app.useGlobalInterceptors(new CacheControlInterceptor());

  app.listen(process.env.APP_PORT, '0.0.0.0');
}

bootstrap();
