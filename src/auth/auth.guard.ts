import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { token } from 'src/utils/token';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const [req] = context.getArgs();
    // req.query = Object.assign(req.query, { _userId: '123' });
    // return true;
    const accessToken = req.headers.authorization;
    if (!accessToken) {
      throw new HttpException('未携带 token', HttpStatus.UNAUTHORIZED);
    }
    const result = token.verifyToken(accessToken);
    if (!result.isOk) {
      throw new HttpException('token 失效', HttpStatus.UNAUTHORIZED);
    } else {
      // 成功
      req.query = Object.assign(req.query, { _userId: '123' });
      // req.query = Object.assign(req.query, { _userId: result.payload?.aud });
      return true;
    }
  }
}
