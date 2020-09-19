import { Router, Request, Response } from 'express';
import userRouter from './user/router';

const router = Router();

router.use('/user', userRouter);
router.get('/test', (req: Request, res: Response) => {
  const responseTestData = { someData: 'hello world' };
  res.status(200).send(responseTestData);
});

export default router;
