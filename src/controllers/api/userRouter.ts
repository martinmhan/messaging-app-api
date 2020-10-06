import { Request } from 'express';
import jwt from 'jsonwebtoken';

import { HTTPMethod, StatusCode, JSONResponse, ErrorMessage } from '../../types/types';
import User from '../../models/User';
import BaseController from './BaseController';
import RouterContainer from './RouterContainer';

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

  async handleRequest(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
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

class CreateUser extends BaseController {
  async handleRequest(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
    const { user } = req.body;

    if (!user || !user.userName || !user.password || !user.firstName || !user.lastName || !user.email) {
      return this.format(StatusCode.badRequest, ErrorMessage.MISSING_INFO);
    }

    try {
      const existingUser = await User.findByUserName(user.userName);
      if (existingUser) {
        return this.format(StatusCode.badRequest, ErrorMessage.USERNAME_TAKEN);
      }

      const newUser = await User.create(user);
      return this.format(StatusCode.created, null, newUser.truncate());
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_CREATING_USER);
    }
  }
}

class GetUser extends BaseController {
  async handleRequest(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
    const { userId } = req.params;

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return this.format(StatusCode.badRequest, ErrorMessage.INVALID_USER_ID);
    }

    if (req.user?.getId() !== userIdInt) {
      return this.format(StatusCode.forbidden, ErrorMessage.UNAUTHORIZED);
    }

    try {
      return this.format(StatusCode.ok, null, req.user.truncate());
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_FINDING_USER);
    }
  }
}

class UpdateUser extends BaseController {
  async handleRequest(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
    const { fieldsToUpdate } = req.body;
    const { userId } = req.params;

    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      return this.format(StatusCode.badRequest, ErrorMessage.INVALID_USER_ID);
    }

    if (req.user?.getId() !== userIdInt) {
      return this.format(StatusCode.forbidden, ErrorMessage.UNAUTHORIZED);
    }

    if (!fieldsToUpdate) {
      return this.format(StatusCode.badRequest, ErrorMessage.MISSING_INFO);
    }

    try {
      const updatedUser = await req.user.update(fieldsToUpdate);
      return this.format(StatusCode.ok, null, updatedUser.truncate());
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_UPDATING_USER);
    }
  }
}

class DeleteUser extends BaseController {
  async handleRequest(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
    const { userId } = req.params;

    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      return this.format(StatusCode.badRequest, ErrorMessage.INVALID_USER_ID);
    }

    if (req.user?.getId() !== userIdInt) {
      return this.format(StatusCode.forbidden, ErrorMessage.UNAUTHORIZED);
    }

    try {
      await req.user.delete();
      return this.format(StatusCode.ok, null, 'User deleted successfully');
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_DELETING_USER);
    }
  }
}

class GetConversations extends BaseController {
  async handleRequest(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
    const { userId } = req.params;

    const userIdInt = parseInt(userId, 10);
    if (req.user?.getId() !== userIdInt) {
      return this.format(StatusCode.forbidden, ErrorMessage.UNAUTHORIZED);
    }

    try {
      const conversations = await req.user.getConversations();
      const conversationsTruncated = conversations.map(c => c.truncate());
      return this.format(StatusCode.ok, null, conversationsTruncated);
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_FINDING_USER_CONVOS);
    }
  }
}

const userRouter = new RouterContainer();
userRouter.useControllers([
  new LoginUser(HTTPMethod.POST, '/login'),
  new CreateUser(HTTPMethod.POST, '/'),
  new GetUser(HTTPMethod.GET, '/:userId'),
  new UpdateUser(HTTPMethod.PATCH, '/:userId'),
  new DeleteUser(HTTPMethod.DELETE, '/:userId'),
  new GetConversations(HTTPMethod.GET, '/:userId/conversations'),
]);

export default userRouter;
