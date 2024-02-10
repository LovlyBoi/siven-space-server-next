import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        console.log(req.originalUrl);
        if (!req.originalUrl.startsWith('/image') && req.method === 'GET') {
          res.header('Cache-Control', 'no-store');
        }
      }),
    );
  }
}
