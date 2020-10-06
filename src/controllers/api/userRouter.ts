import { Request } from 'express';
import jwt from 'jsonwebtoken';

import * as types from '../../types/types';
import User from '../../models/User';
import BaseController from './BaseController';
import RouterContainer from './RouterContainer';

class LoginUser extends BaseController {
  httpMethod = types.HTTPMethod.POST;
  path = '/login';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const authorizationHeader: string = req.headers.authorization;
    if (!authorizationHeader) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.UNSUCCESSFUL_LOGIN);
    }

    const userNamePassword: string = Buffer.from(authorizationHeader?.replace('Basic ', ''), 'base64').toString();
    const [userName, password] = userNamePassword?.split(':');

    const user = await User.findByUserName(userName);
    if (!user || !user?.validatePassword(password)) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.UNSUCCESSFUL_LOGIN);
    }

    const jwtSecretKey = process.env.JWT_KEY;
    const jwtPayload = {
      userName: user.getUserName(),
      userId: user.getId(),
    };
    const jwtOptions = {
      expiresIn: '4 hours',
    };

    const jsonWebToken = jwt.sign(jwtPayload, jwtSecretKey, jwtOptions);
    const userId = user.getId();

    return this.format(types.StatusCode.created, null, { jsonWebToken, userId });
  }
}

class CreateUser extends BaseController {
  httpMethod = types.HTTPMethod.POST;
  path = '/';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { user } = req.body;

    if (!user || !user.userName || !user.password || !user.firstName || !user.lastName || !user.email) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.MISSING_INFO);
    }

    try {
      const existingUser = await User.findByUserName(user.userName);
      if (existingUser) {
        return this.format(types.StatusCode.badRequest, types.ErrorMessage.USERNAME_TAKEN);
      }

      const newUser = await User.create(user);
      return this.format(types.StatusCode.created, null, newUser.truncate());
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_CREATING_USER);
    }
  }
}

class GetUser extends BaseController {
  httpMethod = types.HTTPMethod.GET;
  path = '/:userId';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { userId } = req.params;

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.INVALID_USER_ID);
    }

    if (req.user.getId() !== userIdInt) {
      return this.format(types.StatusCode.forbidden, types.ErrorMessage.UNAUTHORIZED);
    }

    try {
      return this.format(types.StatusCode.ok, null, req.user.truncate());
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_FINDING_USER);
    }
  }
}

class UpdateUser extends BaseController {
  httpMethod = types.HTTPMethod.PATCH;
  path = '/:userId';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { fieldsToUpdate } = req.body;
    const { userId } = req.params;

    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.INVALID_USER_ID);
    }

    if (req.user.getId() !== userIdInt) {
      return this.format(types.StatusCode.forbidden, types.ErrorMessage.UNAUTHORIZED);
    }

    if (!fieldsToUpdate) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.MISSING_INFO);
    }

    try {
      const updatedUser = await req.user.update(fieldsToUpdate);
      return this.format(types.StatusCode.ok, null, updatedUser.truncate());
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_UPDATING_USER);
    }
  }
}

class DeleteUser extends BaseController {
  httpMethod = types.HTTPMethod.DELETE;
  path = '/:userId';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { userId } = req.params;

    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.INVALID_USER_ID);
    }

    if (req.user.getId() !== userIdInt) {
      return this.format(types.StatusCode.forbidden, types.ErrorMessage.UNAUTHORIZED);
    }

    try {
      await req.user.delete();
      return this.format(types.StatusCode.ok, null, 'User deleted successfully');
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_DELETING_USER);
    }
  }
}

class GetConversations extends BaseController {
  httpMethod = types.HTTPMethod.GET;
  path = '/:userId/conversations';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { userId } = req.params;

    const userIdInt = parseInt(userId, 10);
    if (req.user.getId() !== userIdInt) {
      return this.format(types.StatusCode.forbidden, types.ErrorMessage.UNAUTHORIZED);
    }

    try {
      const conversations = await req.user.getConversations();
      const conversationsTruncated = conversations.map(c => c.truncate());
      return this.format(types.StatusCode.ok, null, conversationsTruncated);
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_FINDING_USER_CONVOS);
    }
  }
}

const userRouter = new RouterContainer();
userRouter.useControllers([
  new LoginUser(),
  new CreateUser(),
  new GetUser(),
  new UpdateUser(),
  new DeleteUser(),
  new GetConversations(),
]);

export default userRouter;
