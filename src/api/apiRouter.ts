import RouterContainer from './RouterContainer';
import authenticationHandler from './controllers/Authentication';
import userRouter from './routers/userRouter';
import conversationRouter from './routers/conversationRouter';

const apiRouter = new RouterContainer();
apiRouter.useHandler('*', authenticationHandler);
apiRouter.useRouter('/user', userRouter);
apiRouter.useRouter('/conversation', conversationRouter);

export default apiRouter;
