import { Request } from 'express';

import { StatusCode, JSONResponse, ErrorMessage } from '../../types/types';
import Conversation from '../../models/Conversation';
import BaseController from '../BaseController';

class CreateMessage extends BaseController {
  async handleRequest(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
    const userId = req.user?.getId();
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!userId) {
      return this.format(StatusCode.badRequest, ErrorMessage.UNAUTHENTICATED);
    }

    const conversationIdInt = parseInt(conversationId, 10);
    if (isNaN(conversationIdInt)) {
      return this.format(StatusCode.badRequest, ErrorMessage.INVALID_CONVO_ID);
    }

    if (!message || !message.text) {
      return this.format(StatusCode.badRequest, ErrorMessage.MISSING_INFO);
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

      const newMessage = await conversation.createMessage({ text: message.text, userId });
      return this.format(StatusCode.created, null, newMessage);
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_CREATING_MESSAGE);
    }
  }
}

export default CreateMessage;
