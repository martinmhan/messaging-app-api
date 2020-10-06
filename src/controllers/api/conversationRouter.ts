import { Request } from 'express';

import * as types from '../../types/types';
import Conversation from '../../models/Conversation';
import BaseController from './BaseController';
import RouterContainer from './RouterContainer';

class CreateConversation extends BaseController {
  httpMethod = types.HTTPMethod.POST;
  path = '/';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { conversation } = req.body;
    const userId = req.user.getId();

    if (!conversation || !conversation.name) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.MISSING_INFO);
    }

    try {
      const newConversation = await Conversation.create(conversation);
      await newConversation.addUser(userId);
      return this.format(types.StatusCode.created, null, newConversation.truncate());
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_CREATING_CONVO);
    }
  }
}

class GetConversation extends BaseController {
  httpMethod = types.HTTPMethod.GET;
  path = '/:conversationId';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { conversationId } = req.params;
    const userId = req.user?.getId();

    const conversationIdInt = parseInt(conversationId, 10);
    if (isNaN(conversationIdInt)) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.INVALID_CONVO_ID);
    }

    try {
      const conversation = await Conversation.findById(conversationIdInt);
      if (!conversation) {
        return this.format(types.StatusCode.badRequest, types.ErrorMessage.CONVO_DOES_NOT_EXIST);
      }

      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return this.format(types.StatusCode.forbidden, types.ErrorMessage.UNAUTHORIZED);
      }

      return this.format(types.StatusCode.ok, null, conversation.truncate());
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_FINDING_CONVO);
    }
  }
}

class UpdateConversation extends BaseController {
  httpMethod = types.HTTPMethod.PATCH;
  path = '/:conversationId';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { fieldsToUpdate } = req.body;
    const { conversationId } = req.params;
    const userId = req.user.getId();

    const conversationIdInt = parseInt(conversationId, 10);
    if (isNaN(conversationIdInt)) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.INVALID_CONVO_ID);
    }

    try {
      const conversation = await Conversation.findById(conversationIdInt);
      if (!conversation) {
        return this.format(types.StatusCode.badRequest, types.ErrorMessage.CONVO_DOES_NOT_EXIST);
      }

      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return this.format(types.StatusCode.forbidden, types.ErrorMessage.UNAUTHORIZED);
      }

      const updatedConversation = await conversation.update(fieldsToUpdate);
      return this.format(types.StatusCode.ok, null, updatedConversation.truncate());
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_UPDATING_CONVO);
    }
  }
}

class GetMessages extends BaseController {
  httpMethod = types.HTTPMethod.GET;
  path = '/:conversationId/messages';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { conversationId } = req.params;
    const userId = req.user?.getId();

    const conversationIdInt = parseInt(conversationId, 10);
    if (isNaN(conversationIdInt)) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.INVALID_CONVO_ID);
    }

    try {
      const conversation = await Conversation.findById(conversationIdInt);
      if (!conversation) {
        return this.format(types.StatusCode.badRequest, types.ErrorMessage.CONVO_DOES_NOT_EXIST);
      }

      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return this.format(types.StatusCode.forbidden, types.ErrorMessage.UNAUTHORIZED);
      }

      const messages = await conversation.getMessages();
      return this.format(types.StatusCode.ok, null, messages);
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_FINDING_MESSAGES);
    }
  }
}

class CreateMessage extends BaseController {
  httpMethod = types.HTTPMethod.POST;
  path = '/:conversationId/message';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { conversationId } = req.params;
    const { message } = req.body;
    const userId = req.user?.getId();

    const conversationIdInt = parseInt(conversationId, 10);
    if (isNaN(conversationIdInt)) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.INVALID_CONVO_ID);
    }

    if (!message || !message.text) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.MISSING_INFO);
    }

    try {
      const conversation = await Conversation.findById(conversationIdInt);
      if (!conversation) {
        return this.format(types.StatusCode.badRequest, types.ErrorMessage.CONVO_DOES_NOT_EXIST);
      }

      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return this.format(types.StatusCode.forbidden, types.ErrorMessage.UNAUTHORIZED);
      }

      const newMessage = await conversation.createMessage({ text: message.text, userId });
      return this.format(types.StatusCode.created, null, newMessage);
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_CREATING_MESSAGE);
    }
  }
}

class GetConversationMembers extends BaseController {
  httpMethod = types.HTTPMethod.GET;
  path = '/:conversationId/members';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { conversationId } = req.params;
    const userId = req.user?.getId();

    const conversationIdInt = parseInt(conversationId, 10);
    if (isNaN(conversationIdInt)) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.INVALID_CONVO_ID);
    }

    try {
      const conversation = await Conversation.findById(conversationIdInt);
      if (!conversation) {
        return this.format(types.StatusCode.badRequest, types.ErrorMessage.CONVO_DOES_NOT_EXIST);
      }

      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return this.format(types.StatusCode.forbidden, types.ErrorMessage.UNAUTHORIZED);
      }

      const conversationMembersUnTruncated = await conversation.getUsers();
      const conversationMembers = conversationMembersUnTruncated.map(user => user.truncate());
      return this.format(types.StatusCode.ok, null, conversationMembers);
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_FINDING_CONVO_MEMBERS);
    }
  }
}

class AddUserToConversation extends BaseController {
  httpMethod = types.HTTPMethod.POST;
  path = '/:conversationId/member';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { conversationId } = req.params;
    const { userIdToAdd } = req.body;
    const userId = req.user?.getId();

    const conversationIdInt = parseInt(conversationId, 10);
    if (isNaN(conversationIdInt)) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.INVALID_CONVO_ID);
    }

    if (isNaN(userIdToAdd)) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.INVALID_USER_ID);
    }

    try {
      const conversation = await Conversation.findById(conversationIdInt);
      if (!conversation) {
        return this.format(types.StatusCode.badRequest, types.ErrorMessage.CONVO_DOES_NOT_EXIST);
      }

      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return this.format(types.StatusCode.forbidden, types.ErrorMessage.UNAUTHORIZED);
      }

      const isUserToAddAlreadyInConversation = await conversation.checkIfHasUser(userIdToAdd);
      if (isUserToAddAlreadyInConversation) {
        return this.format(types.StatusCode.forbidden, types.ErrorMessage.USER_ALREADY_IN_CONVO);
      }

      await conversation.addUser(userIdToAdd);
      return this.format(types.StatusCode.created, null, 'User added to conversation');
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_ADDING_USER_TO_CONVO);
    }
  }
}

class RemoveUserFromConversation extends BaseController {
  httpMethod = types.HTTPMethod.DELETE;
  path = '/:conversationId/member';

  async handleRequest(req: Request): Promise<{ statusCode: types.StatusCode; jsonResponse: types.JSONResponse }> {
    const { conversationId } = req.params;
    const userId = req.user?.getId();

    const conversationIdInt = parseInt(conversationId, 10);
    if (isNaN(conversationIdInt)) {
      return this.format(types.StatusCode.badRequest, types.ErrorMessage.INVALID_CONVO_ID);
    }

    try {
      const conversation = await Conversation.findById(conversationIdInt);
      if (!conversation) {
        return this.format(types.StatusCode.badRequest, types.ErrorMessage.CONVO_DOES_NOT_EXIST);
      }

      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return this.format(types.StatusCode.forbidden, types.ErrorMessage.USER_NOT_IN_CONVO);
      }

      await conversation.removeUser(userId);
      return this.format(types.StatusCode.ok, null, 'User removed from conversation');
    } catch (error) {
      return this.format(types.StatusCode.internalServerError, types.ErrorMessage.ERROR_REMOVING_USER_FROM_CONVO);
    }
  }
}

const conversationRouter = new RouterContainer();
conversationRouter.useControllers([
  new CreateConversation(),
  new GetConversation(),
  new UpdateConversation(),
  new CreateMessage(),
  new GetMessages(),
  new GetConversationMembers(),
  new AddUserToConversation(),
  new RemoveUserFromConversation(),
]);

export default conversationRouter;
