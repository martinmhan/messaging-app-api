import { Router, Request, Response } from 'express';

import Conversation from '../../types/conversation';

const getConversation = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).send('hiya!');
};

const router = Router();

router.get('/:conversationId', getConversation);

export default router;
