import { Request } from 'express';

import { HTTPMethod, StatusCode, JSONResponse, ErrorMessage } from '../../types/types';
import Conversation from '../../models/Conversation';
import BaseController from './BaseController';
import RouterContainer from './RouterContainer';

class CreateConversation extends BaseController {
  async handleRequest(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
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

class UpdateConversation extends BaseController {
  async handleRequest(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
    const userId = req.user?.getId();
    const { fieldsToUpdate } = req.body;
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

      const updatedConversation = await conversation.update(fieldsToUpdate);
      return this.format(StatusCode.ok, null, updatedConversation.truncate());
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_UPDATING_CONVO);
    }
  }
}

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

class GetMessages extends BaseController {
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

      const messages = await conversation.getMessages();
      return this.format(StatusCode.ok, null, messages);
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_FINDING_MESSAGES);
    }
  }
}

class GetConversationMembers extends BaseController {
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

      const conversationMembersUnTruncated = await conversation.getUsers();
      const conversationMembers = conversationMembersUnTruncated.map(user => user.truncate());
      return this.format(StatusCode.ok, null, conversationMembers);
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_FINDING_CONVO_MEMBERS);
    }
  }
}

class AddUserToConversation extends BaseController {
  async handleRequest(req: Request): Promise<{ statusCode: StatusCode; jsonResponse: JSONResponse }> {
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

class RemoveUserFromConversation extends BaseController {
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
        return this.format(StatusCode.forbidden, ErrorMessage.USER_NOT_IN_CONVO);
      }

      await conversation.removeUser(userId);
      return this.format(StatusCode.ok, null, 'User removed from conversation');
    } catch (error) {
      return this.format(StatusCode.internalServerError, ErrorMessage.ERROR_REMOVING_USER_FROM_CONVO);
    }
  }
}

const conversationRouter = new RouterContainer();
conversationRouter.useControllers([
  new CreateConversation(HTTPMethod.POST, '/'),
  new GetConversation(HTTPMethod.GET, '/:conversationId'),
  new UpdateConversation(HTTPMethod.PATCH, '/:conversationId'),
  new CreateMessage(HTTPMethod.POST, '/:conversationId/message'),
  new GetMessages(HTTPMethod.GET, '/:conversationId/messages'),
  new GetConversationMembers(HTTPMethod.GET, '/:conversationId/members'),
  new AddUserToConversation(HTTPMethod.POST, '/:conversationId/member'),
  new RemoveUserFromConversation(HTTPMethod.DELETE, '/:conversationId/member'),
]);

export default conversationRouter;
