import { Request } from 'express';

import { StatusCode, JSONResponse, ErrorMessage } from '../../types/types';
import User from '../../models/User';
import BaseController from '../BaseController';

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

export default CreateUser;
