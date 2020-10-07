import { Request } from 'express';

import { StatusCode, JSONResponse, ErrorMessage } from '../../types/types';
import Conversation from '../../models/Conversation';
import BaseController from '../BaseController';

class AddConversationMember extends BaseController {
  async handler(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
    const userId = req.user?.getId();
    const { conversationId } = req.params;
    const { userIdToAdd } = req.body;

    if (!userId) {
      return this.format(StatusCode.badRequest, ErrorMessage.UNAUTHENTICATED);
    }

    const conversationIdInt = parseInt(conversationId, 10);
    if (isNaN(conversationIdInt)) {
      return this.format(StatusCode.badRequest, ErrorMessage.INVALID_CONVO_ID);
    }

    if (isNaN(userIdToAdd)) {
      return this.format(StatusCode.badRequest, ErrorMessage.INVALID_USER_ID);
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

      const isUserToAddAlreadyInConversation = await conversation.checkIfHasUser(userIdToAdd);
      if (isUserToAddAlreadyInConversation) {
        return this.format(StatusCode.forbidden, ErrorMessage.USER_ALREADY_IN_CONVO);
      }

      await conversation.addUser(userIdToAdd);
      return this.format(StatusCode.created, null, 'User added to conversation');
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_ADDING_USER_TO_CONVO);
    }
  }
}

export default AddConversationMember;
