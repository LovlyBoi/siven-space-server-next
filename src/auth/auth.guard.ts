import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { TokenInfo } from 'src/blogs/types';
import { token } from 'src/utils/token';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const [req] = context.getArgs();
    const accessToken = req.headers.authorization;
    if (!accessToken) {
      throw new HttpException('未携带 token', HttpStatus.UNAUTHORIZED);
    }
    const [isOk, payloadOrError] = token.verifyToken(accessToken);
    if (!isOk) {
      console.log(payloadOrError);
      AuthGuard.handleJWTError(payloadOrError);
    } else if (payloadOrError.type !== 'access') {
      // 不是accesstoken
      throw new HttpException('必须使用 access token', HttpStatus.UNAUTHORIZED);
    } else {
      // 成功
      req.user = payloadOrError as TokenInfo;
      return true;
    }
  }

  // 处理token错误
  static handleJWTError(error: Error): never {
    const { message } = error;

    if (message === 'invalid token') {
      throw new HttpException(
        'The header or payload could not be parsed.',
        HttpStatus.UNAUTHORIZED,
      );
    } else if (message === 'jwt expired') {
      throw new HttpException(
        'The token has expired.',
        HttpStatus.UNAUTHORIZED,
      );
    } else if (message === 'invalid signature') {
      throw new HttpException(
        'The token signature is invalid.',
        HttpStatus.UNAUTHORIZED,
      );
    } else if (message === 'jwt malformed') {
      throw new HttpException(
        'The token is not a valid JWT format.',
        HttpStatus.UNAUTHORIZED,
      );
    } else if (message === 'jwt signature is required') {
      throw new HttpException(
        'The token is missing the signature.',
        HttpStatus.UNAUTHORIZED,
      );
    } else {
      throw new HttpException(
        'An unknown error occurred while parsing the token.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
