import jwt = require('jsonwebtoken');

class Token {
  // 签署token
  signToken = (
    payload: object,
    exp: string | number = Math.floor(Date.now() / 1000) + 60 * 60 * 2,
  ) => {
    // ToDo: 封装jwt签署token。默认2小时失效
    return new Promise<string>((resolve, reject) => {
      const secretKey = process.env.TOKEN_SECRET;
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
        secretKey,
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

  // 解析token
  verifyToken = <T = any>(token: string) => {
    // 封装jwt校验token函数，避免直接抛出错误。
    let payload: T | null = null;
    let error: jwt.VerifyErrors | null = null;

    const secretKey = process.env.TOKEN_SECRET;

    try {
      payload = jwt.verify(token, secretKey) as T;
    } catch (e) {
      error = e as jwt.VerifyErrors;
    }

    if (!error) return [true, payload] as const;
    return [false, error] as const;
  };
}

const token = new Token();
export { token };
