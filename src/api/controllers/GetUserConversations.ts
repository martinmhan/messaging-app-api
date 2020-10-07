import { Request } from 'express';

import { StatusCode, JSONResponse, ErrorMessage } from '../../types/types';
import BaseController from '../BaseController';

class GetUserConversations extends BaseController {
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

export default GetUserConversations;
