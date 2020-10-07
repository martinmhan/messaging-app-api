import { HTTPMethod } from '../../types/types';
import RouterContainer from '../RouterContainer';
import LoginUser from '../controllers/LoginUser';
import CreateUser from '../controllers/CreateUser';
import GetUser from '../controllers/GetUser';
import UpdateUser from '../controllers/UpdateUser';
import UpdateUserPassword from '../controllers/UpdateUserPassword';
import DeleteUser from '../controllers/DeleteUser';
import GetUserConversations from '../controllers/GetUserConversations';

const userRouter = new RouterContainer();

userRouter.useControllers([
  new LoginUser(HTTPMethod.POST, '/login'),
  new CreateUser(HTTPMethod.POST, '/'),
  new GetUser(HTTPMethod.GET, '/:userId'),
  new UpdateUser(HTTPMethod.PATCH, '/:userId'),
  new UpdateUserPassword(HTTPMethod.PUT, '/:userId/password'),
  new DeleteUser(HTTPMethod.DELETE, '/:userId'),
  new GetUserConversations(HTTPMethod.GET, '/:userId/conversations'),
]);

export default userRouter;
