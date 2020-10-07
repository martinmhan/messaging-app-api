import { Request } from 'express';

import { StatusCode, JSONResponse, ErrorMessage } from '../../types/types';
import Conversation from '../../models/Conversation';
import BaseController from '../BaseController';

class CreateConversation extends BaseController {
  async handler(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
    const userId = req.user?.getId();
    const { conversation } = req.body;

    if (!userId) {
      return this.format(StatusCode.badRequest, ErrorMessage.UNAUTHENTICATED);
    }

    if (!conversation || !conversation.name) {
      return this.format(StatusCode.badRequest, ErrorMessage.MISSING_INFO);
    }

    try {
      const newConversation = await Conversation.create(conversation);
      await newConversation.addUser(userId);
      return this.format(StatusCode.created, null, newConversation.truncate());
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_CREATING_CONVO);
    }
  }
}

export default CreateConversation;
