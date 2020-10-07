import { Request } from 'express';
import jwt from 'jsonwebtoken';

import { HTTPMethod, StatusCode, JSONResponse, ErrorMessage } from '../../types/types';
import User from '../../models/User';
import BaseController from '../BaseController';

class LoginUser extends BaseController {
  jwtKey: string;

  constructor(httpMethod: HTTPMethod, path: string) {
    super(httpMethod, path);
    const jwtKey = process.env.JWT_KEY;
    if (!jwtKey) {
      throw new Error(ErrorMessage.MISSING_JWT_KEY);
    }

    this.jwtKey = jwtKey;
  }

  async handler(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
    const authorizationHeader: string | undefined = req.headers.authorization;
    if (!authorizationHeader) {
      return this.format(StatusCode.badRequest, ErrorMessage.UNSUCCESSFUL_LOGIN);
    }

    const userNamePassword: string = Buffer.from(authorizationHeader?.replace('Basic ', ''), 'base64').toString();
    const [userName, password] = userNamePassword?.split(':');

    const user = await User.findByUserName(userName);
    if (!user || !user?.validatePassword(password)) {
      return this.format(StatusCode.badRequest, ErrorMessage.UNSUCCESSFUL_LOGIN);
    }

    const jwtPayload = {
      userName: user.getUserName(),
      userId: user.getId(),
    };
    const jwtOptions = {
      expiresIn: '4 hours',
    };

    const jsonWebToken = jwt.sign(jwtPayload, this.jwtKey, jwtOptions);
    const userId = user.getId();

    return this.format(StatusCode.created, null, { jsonWebToken, userId });
  }
}

export default LoginUser;
