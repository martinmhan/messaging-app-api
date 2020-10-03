import socketIo from 'socket.io';
import jwt from 'jsonwebtoken';

import User from '../../models/User';
import Conversation from '../../models/Conversation';
import { errorMessages } from '../api/utils/constants';
import { events } from './constants';

const jwtKey = process.env.JWT_KEY;

if (!jwtKey) {
  throw new Error('Missing required JWT_KEY environment variable. Please edit .env file');
}

const addSocketHandlers = (io: socketIo.Server): socketIo.Server => {
  io.use(async (socket, next) => {
    if (!socket.handshake?.query?.token) {
      return socket.disconnect();
    }

    const payload = jwt.verify(socket.handshake.query.token, jwtKey);
    const { userName, userId } = payload as { userName: string; userId: number };
    if (!userName || !userId) {
      return socket.disconnect();
    }

    if (!socket.isAuthenticated) {
      socket.isAuthenticated = true;
      socket.userId = userId;
      socket.emit(events.AUTHENTICATED);

      const user = await User.findById(userId);
      const conversations = await user.getConversations();
      conversations.forEach(conversation => {
        socket.join(conversation.getId().toString());
        socket.emit(events.JOINED_ROOM, { conversationId: conversation.getId() });
      });
    }

    next();
  });

  io.on('connection', (socket: socketIo.Socket) => {
    socket.on(events.NEW_MESSAGE, async (payload: { conversationId: number; text: string }) => {
      const { userId } = socket;
      const { conversationId, text } = payload;

      if (!conversationId || !text) {
        return new Error(errorMessages.MISSING_INFO);
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return new Error(errorMessages.CONVO_DOES_NOT_EXIST);
      }

      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return new Error(errorMessages.USER_NOT_IN_CONVO);
      }

      conversation.createMessage({ userId, text });
      socket.to(conversation.getId().toString()).emit(events.NEW_MESSAGE, { conversationId, userId, text });
    });

    socket.on(events.JOIN_ROOM, async (payload: { conversationId: number }) => {
      const { userId } = socket;
      const { conversationId } = payload;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return new Error(errorMessages.CONVO_DOES_NOT_EXIST);
      }

      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return new Error(errorMessages.USER_NOT_IN_CONVO);
      }

      socket.join(conversationId.toString());
      socket.emit(events.JOINED_ROOM, { conversationId });
    });

    socket.on(events.LEAVE_ROOM, async (payload: { conversationId: number }) => {
      const { conversationId } = payload;

      socket.leave(conversationId.toString());
      socket.emit(events.LEFT_ROOM, { conversationId });
    });
  });

  return io;
};

export default addSocketHandlers;
