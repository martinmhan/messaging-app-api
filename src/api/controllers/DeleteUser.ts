import { Request } from 'express';

import { StatusCode, JSONResponse, ErrorMessage } from '../../types/types';
import BaseController from '../BaseController';

class DeleteUser extends BaseController {
  async handler(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
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

export default DeleteUser;
