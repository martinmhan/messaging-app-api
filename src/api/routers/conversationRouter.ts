import { HTTPMethod } from '../../types/types';
import RouterContainer from '../RouterContainer';
import CreateConversation from '../controllers/CreateConversation';
import GetConversation from '../controllers/GetConversation';
import UpdateConversation from '../controllers/UpdateConversation';
import CreateMessage from '../controllers/CreateMessage';
import GetMessages from '../controllers/GetMessages';
import GetConversationMembers from '../controllers/GetConversationMembers';
import AddConversationMember from '../controllers/AddConversationMember';
import RemoveConversationMember from '../controllers/RemoveConversationMember';

const conversationRouter = new RouterContainer();

conversationRouter.useControllers([
  new CreateConversation(HTTPMethod.POST, '/'),
  new GetConversation(HTTPMethod.GET, '/:conversationId'),
  new UpdateConversation(HTTPMethod.PATCH, '/:conversationId'),
  new CreateMessage(HTTPMethod.POST, '/:conversationId/message'),
  new GetMessages(HTTPMethod.GET, '/:conversationId/messages'),
  new GetConversationMembers(HTTPMethod.GET, '/:conversationId/members'),
  new AddConversationMember(HTTPMethod.POST, '/:conversationId/member'),
  new RemoveConversationMember(HTTPMethod.DELETE, '/:conversationId/member'),
]);

export default conversationRouter;
