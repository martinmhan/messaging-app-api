import { Router, Request, Response } from 'express';

import Conversation from '../../models/Conversation';

const createConversation = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).send('hiya!');
};

const getConversation = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).send('hiya!');
};

const updateConversation = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).send('hiya!');
};

const deleteConversation = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).send('hiya!');
};

const router = Router();

router.post('/', createConversation);
router.get('/:conversationId', getConversation);
router.patch('/:conversationId', updateConversation);
router.delete('/:conversationId', deleteConversation);

export default router;
