import { Request } from 'express';

import { StatusCode, JSONResponse, ErrorMessage } from '../../types/types';
import Conversation from '../../models/Conversation';
import BaseController from '../BaseController';

class GetConversation extends BaseController {
  async handleRequest(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
    const userId = req.user?.getId();
    const { conversationId } = req.params;

    if (!userId) {
      return this.format(StatusCode.badRequest, ErrorMessage.UNAUTHENTICATED);
    }

    const conversationIdInt = parseInt(conversationId, 10);
    if (isNaN(conversationIdInt)) {
      return this.format(StatusCode.badRequest, ErrorMessage.INVALID_CONVO_ID);
    }

    try {
      const conversation = await Conversation.findById(conversationIdInt);
      if (!conversation) {
        return this.format(StatusCode.badRequest, ErrorMessage.CONVO_DOES_NOT_EXIST);
      }

      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return this.format(StatusCode.forbidden, ErrorMessage.UNAUTHORIZED);
      }

      return this.format(StatusCode.ok, null, conversation.truncate());
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_FINDING_CONVO);
    }
  }
}

export default GetConversation;
