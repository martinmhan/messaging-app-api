import { Router } from 'express';

import authenticate from './authenticate';
import userRouter from './user/router';
import conversationRouter from './conversation/router';

const apiRouter = Router();
apiRouter.use('*', authenticate);
apiRouter.use('/user', userRouter);
apiRouter.use('/conversation', conversationRouter);

apiRouter.get('/test', (req, res) => {
  res.status(200).send('hello world');
});

export default apiRouter;
