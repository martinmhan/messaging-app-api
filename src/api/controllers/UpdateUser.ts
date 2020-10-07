import { Request } from 'express';

import { StatusCode, JSONResponse, ErrorMessage } from '../../types/types';
import BaseController from '../BaseController';

class UpdateUser extends BaseController {
  async handler(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
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

export default UpdateUser;
