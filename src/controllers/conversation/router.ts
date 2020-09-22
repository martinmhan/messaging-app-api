import { Router, Request, Response } from 'express';

import Conversation from '../../models/Conversation';
import JSONResponse from '../JSONResponse';
import { statusCodes, errorMessages } from '../constants';

const createConversation = async (req: Request, res: Response): Promise<Response> => {
  const { conversation } = req.body;
  const userId = req.user.getId();

  if (!conversation || !conversation.name) {
    return res.status(400).send('Missing new conversation information');
  }

  try {
    const newConversation = await Conversation.create(conversation);
    await newConversation.addUser(userId);
    return res.status(statusCodes.success.created).send(new JSONResponse(null, { newConversation }));
  } catch (error) {
    return res.status(statusCodes.clientError.badRequest).send('Error creating conversation');
  }
};

const getConversation = async (req: Request, res: Response): Promise<Response> => {
  const { conversationId } = req.params;
  const userId = req.user?.getId();

  const conversationIdInt = parseInt(conversationId, 10);
  if (isNaN(conversationIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('conversationId must be an integer'));
  }

  try {
    const conversation = await Conversation.findById(conversationIdInt);
    if (!conversation) {
      return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Conversation not found'));
    }

    const conversationMembers = await conversation.getUserIds();
    if (!conversationMembers.includes(userId)) {
      return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
    }

    return res.status(statusCodes.success.ok).send(new JSONResponse(null, { conversation }));
  } catch (error) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Error getting conversation'));
  }
};

const updateConversation = async (req: Request, res: Response): Promise<Response> => {
  return res.status(statusCodes.success.ok).send('hiya!');
};

const deleteConversation = async (req: Request, res: Response): Promise<Response> => {
  const { conversationId } = req.params;
  const userId = req.user?.getId();

  const conversationIdInt = parseInt(conversationId, 10);
  if (isNaN(conversationIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('conversationId must be an integer'));
  }

  try {
    const conversation = await Conversation.findById(conversationIdInt);
    if (!conversation) {
      return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Conversation not found'));
    }

    const conversationMembers = await conversation.getUserIds();
    if (!conversationMembers.includes(userId)) {
      return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
    }

    await conversation.delete();
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, 'Conversation deleted successfully'));
  } catch (error) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Error deleting conversation'));
  }
};

const getMessages = async (req: Request, res: Response): Promise<Response> => {
  const { conversationId } = req.params;
  const userId = req.user?.getId();

  const conversationIdInt = parseInt(conversationId, 10);
  if (isNaN(conversationIdInt)) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('conversationId must be an integer'));
  }

  try {
    const conversation = await Conversation.findById(conversationIdInt);
    if (!conversation) {
      return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Conversation not found'));
    }

    const conversationMembers = await conversation.getUserIds();
    if (!conversationMembers.includes(userId)) {
      return res.status(statusCodes.clientError.forbidden).send(new JSONResponse(errorMessages.UNAUTHORIZED));
    }

    const messages = await conversation.getMessages();
    return res.status(statusCodes.success.ok).send(new JSONResponse(null, { messages }));
  } catch (error) {
    return res.status(statusCodes.clientError.badRequest).send(new JSONResponse('Error finding messages'));
  }
};

const addUserToConversation = async (req: Request, res: Response): Promise<Response> => {
  const { userIdToAdd } = req.body;
  const userId = req.user?.getId();

  return res
    .status(statusCodes.success.created)
    .send(new JSONResponse(null, 'Successfully added user to conversation'));
};

const removeUserFromConversation = async (req: Request, res: Response): Promise<Response> => {
  
};

const router = Router();
router.post('/', createConversation);
router.get('/:conversationId', getConversation);
router.patch('/:conversationId', updateConversation);
router.delete('/:conversationId', deleteConversation);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/user', addUserToConversation);
router.delete('/:conversationId/user', removeUserFromConversation);

export default router;
