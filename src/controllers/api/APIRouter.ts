import RouterContainer from './RouterContainer';
import authenticationHandler from './authentication';
import userRouter from './userRouter';
import conversationRouter from './conversationRouter';

const apiRouter = new RouterContainer();
apiRouter.useHandler('*', authenticationHandler);
apiRouter.useRouter('/user', userRouter);
apiRouter.useRouter('/conversation', conversationRouter);

export default apiRouter;
