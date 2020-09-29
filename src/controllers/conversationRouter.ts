import { Router, Request, Response } from 'express';

import JSONResponse from './utils/JSONResponse';
import { statusCodes, errorMessages } from './utils/constants';
import Conversation from '../models/Conversation';

const createConversation = async (req: Request, res: Response): Promise<Response> => {
  const { conversation } = req.body;
  const userId = req.user.getId();

  if (!conversation || !conversation.name) {
    return res.status(400).send(errorMessages.MISSING_INFO);
  }

  try {
    const newConversation = await Conversation.create(conversation);
    await newConversation.addUser(userId);
    return res.status(statusCodes.success.created).send(new JSONResponse(null, { newConversation }));
  } catch (error) {
    return res.status(statusCodes.server.internalServerError).send(errorMessages.ERROR_CREATING_CONVO);
  }
};

const getConversation = async (req: Request, res: Response): Promise<Response> => {
  const { conversationId } = req.params;
  const userId = req.user?.getId();

  const conversationIdInt = parseInt(conversationId, 10);
  if (isNaN(conversationIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.INVALID_CONVO_ID));
  }

  try {
    const conversation = await Conversation.findById(conversationIdInt);
    if (!conversation) {
      return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.CONVO_DOES_NOT_EXIST));
    }

    const isUserInConversation = await conversation.checkIfHasUser(userId);
    if (!isUserInConversation) {
      return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
    }

    return res.status(statusCodes.success.ok).send(new JSONResponse(null, { conversation }));
  } catch (error) {
    return res.status(statusCodes.server.internalServerError).send(new JSONResponse(errorMessages.ERROR_FINDING_CONVO));
  }
};

const updateConversation = async (req: Request, res: Response): Promise<Response> => {
  const { fieldsToUpdate } = req.body;
  const { conversationId } = req.params;
  const userId = req.user.getId();

  const conversationIdInt = parseInt(conversationId, 10);
  if (isNaN(conversationIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.INVALID_CONVO_ID));
  }

  try {
    const conversation = await Conversation.findById(conversationIdInt);
    if (!conversation) {
      return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.CONVO_DOES_NOT_EXIST));
    }

    const isUserInConversation = await conversation.checkIfHasUser(userId);
    if (!isUserInConversation) {
      return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
    }

    const updatedConversation = await conversation.update(fieldsToUpdate);
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, { updatedConversation }));
  } catch (error) {
    return res
      .status(statusCodes.server.internalServerError)
      .send(new JSONResponse(errorMessages.ERROR_UPDATING_CONVO));
  }
};

const getMessages = async (req: Request, res: Response): Promise<Response> => {
  const { conversationId } = req.params;
  const userId = req.user?.getId();

  const conversationIdInt = parseInt(conversationId, 10);
  if (isNaN(conversationIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.INVALID_CONVO_ID));
  }

  try {
    const conversation = await Conversation.findById(conversationIdInt);
    if (!conversation) {
      return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.CONVO_DOES_NOT_EXIST));
    }

    const isUserInConversation = await conversation.checkIfHasUser(userId);
    if (!isUserInConversation) {
      return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
    }

    const messages = await conversation.getMessages();
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, { messages }));
  } catch (error) {
    return res
      .status(statusCodes.server.internalServerError)
      .send(new JSONResponse(errorMessages.ERROR_FINDING_MESSAGES));
  }
};

const createMessage = async (req: Request, res: Response): Promise<Response> => {
  const { conversationId } = req.params;
  const { message } = req.body;
  const userId = req.user?.getId();

  const conversationIdInt = parseInt(conversationId, 10);
  if (isNaN(conversationIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.INVALID_CONVO_ID));
  }

  if (!message || !message.conversationId || !message.text) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.MISSING_INFO));
  }

  try {
    const conversation = await Conversation.findById(conversationIdInt);
    if (!conversation) {
      return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.CONVO_DOES_NOT_EXIST));
    }

    const isUserInConversation = await conversation.checkIfHasUser(userId);
    if (!isUserInConversation) {
      return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
    }

    const newMessage = await conversation.createMessage({ ...message, userId });
    return res.status(statusCodes.success.created).send(new JSONResponse(null, { newMessage }));
  } catch (error) {
    return res
      .status(statusCodes.server.internalServerError)
      .send(new JSONResponse(errorMessages.ERROR_CREATING_MESSAGE));
  }
};

const getConversationMembers = async (req: Request, res: Response): Promise<Response> => {
  const { conversationId } = req.params;
  const userId = req.user?.getId();

  const conversationIdInt = parseInt(conversationId, 10);
  if (isNaN(conversationIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.INVALID_CONVO_ID));
  }

  try {
    const conversation = await Conversation.findById(conversationIdInt);
    if (!conversation) {
      return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.CONVO_DOES_NOT_EXIST));
    }

    const isUserInConversation = await conversation.checkIfHasUser(userId);
    if (!isUserInConversation) {
      return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
    }

    const conversationMembersUnTruncated = await conversation.getUsers();
    const conversationMembers = conversationMembersUnTruncated.map(user => user.truncate());
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, { conversationMembers }));
  } catch (error) {
    return res
      .status(statusCodes.server.internalServerError)
      .send(new JSONResponse(errorMessages.ERROR_FINDING_CONVO_MEMBERS));
  }
};

const addUserToConversation = async (req: Request, res: Response): Promise<Response> => {
  const { conversationId } = req.params;
  const { userIdToAdd } = req.body;
  const userId = req.user?.getId();

  const conversationIdInt = parseInt(conversationId, 10);
  if (isNaN(conversationIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.INVALID_CONVO_ID));
  }

  if (isNaN(userIdToAdd)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.INVALID_USER_ID));
  }

  try {
    const conversation = await Conversation.findById(conversationIdInt);
    if (!conversation) {
      return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.CONVO_DOES_NOT_EXIST));
    }

    const isUserInConversation = await conversation.checkIfHasUser(userId);
    if (!isUserInConversation) {
      return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
    }

    const isUserToAddAlreadyInConversation = await conversation.checkIfHasUser(userIdToAdd);
    if (isUserToAddAlreadyInConversation) {
      return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.USER_ALREADY_IN_CONVO));
    }

    await conversation.addUser(userIdToAdd);
    return res.status(statusCodes.success.created).send(new JSONResponse(null, 'User added to conversation'));
  } catch (error) {
    return res
      .status(statusCodes.server.internalServerError)
      .send(new JSONResponse(errorMessages.ERROR_ADDING_USER_TO_CONVO));
  }
};

const removeUserFromConversation = async (req: Request, res: Response): Promise<Response> => {
  const { conversationId } = req.params;
  const { userIdToRemove } = req.body;
  const userId = req.user?.getId();

  const conversationIdInt = parseInt(conversationId, 10);
  if (isNaN(conversationIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.INVALID_CONVO_ID));
  }

  if (isNaN(userIdToRemove)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.INVALID_USER_ID));
  }

  if (userIdToRemove !== userId) {
    return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
  }

  try {
    const conversation = await Conversation.findById(conversationIdInt);
    if (!conversation) {
      return res.status(statusCodes.clientError.badRequest).send(new JSONResponse(errorMessages.CONVO_DOES_NOT_EXIST));
    }

    const isUserInConversation = await conversation.checkIfHasUser(userId);
    if (!isUserInConversation) {
      return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.USER_NOT_IN_CONVO));
    }

    await conversation.removeUser(userIdToRemove);
    return res.status(statusCodes.success.created).send(new JSONResponse(null, 'User removed from conversation'));
  } catch (error) {
    return res
      .status(statusCodes.server.internalServerError)
      .send(new JSONResponse(errorMessages.ERROR_REMOVING_USER_FROM_CONVO));
  }
};

const router = Router();
router.post('/', createConversation);
router.get('/:conversationId', getConversation);
router.patch('/:conversationId', updateConversation);
router.post('/:conversationId/message', createMessage);
router.get('/:conversationId/messages', getMessages);
router.get('/:conversationId/members', getConversationMembers);
router.post('/:conversationId/member', addUserToConversation);
router.delete('/:conversationId/member', removeUserFromConversation);

export default router;
