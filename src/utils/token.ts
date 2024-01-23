import jwt from 'jsonwebtoken';

class Token {
  secretKey = `a3421b6a8fae2603ec3dc2ead19687585eacf192b61724ca9fd10bc165caef17`;

  signToken = (
    payload: object,
    exp: string | number = Math.floor(Date.now() / 1000) + 60 * 60 * 2,
  ) => {
    // ToDo: 封装jwt签署token。默认2小时失效
    return new Promise<string>((resolve, reject) => {
      jwt.sign(
        Object.assign(
          {
            // exp过期时间
            exp,
            // iat签发时间
            iat: Math.floor(Date.now() / 1000),
          },
          payload,
        ),
        this.secretKey,
        (err, token) => {
          if (err || !token) {
            reject(err);
          } else {
            resolve(token);
          }
        },
      );
    });
  };

  verifyToken = <T = any>(
    token: string,
  ): {
    isOk: boolean;
    error: jwt.VerifyErrors | null;
    payload: T | null;
  } => {
    // ToDo: 封装jwt校验token函数，避免直接抛出错误。
    let payload: T | null = null;
    let error: jwt.VerifyErrors | null = null;
    try {
      payload = jwt.verify(token, this.secretKey) as T;
    } catch (e) {
      error = e as jwt.VerifyErrors;
    }
    return {
      isOk: !!!error,
      error,
      payload,
    };
  };
}

const token = new Token();
export { token };
