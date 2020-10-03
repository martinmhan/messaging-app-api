import socketIo from 'socket.io';
import jwt from 'jsonwebtoken';

import User from '../models/User';
import Conversation from '../models/Conversation';
import { errorMessages } from './utils/constants';

const jwtKey = process.env.JWT_KEY;

if (!jwtKey) {
  throw new Error('Missing required JWT_KEY environment variable. Please edit .env file');
}

const events = {
  serverToClient: {
    AUTHENTICATED: 'authenticated',
    NEW_MESSAGE: 'newMessage',
    JOINED_ROOM: 'joinedConversationRoom',
    LEFT_ROOM: 'leftConversationRoom',
  },
  clientToServer: {
    NEW_MESSAGE: 'newMessage',
    JOIN_ROOM: 'joinConversationRoom',
    LEAVE_ROOM: 'leaveConversationRoom',
  },
};

const socketHandlers = (io: socketIo.Server): void => {
  io.use(async (socket, next) => {
    if (!socket.handshake.query.token) {
      return socket.disconnect();
    }

    const { token } = socket.handshake.query;
    const payload = jwt.verify(token, jwtKey);
    const { userName, userId } = payload as { userName: string; userId: number };
    if (!userName || !userId) {
      return socket.disconnect();
    }

    if (!socket.isAuthenticated) {
      socket.isAuthenticated = true;
      socket.userId = userId;
      socket.emit(events.serverToClient.AUTHENTICATED);

      const user = await User.findById(userId);
      const conversations = await user.getConversations();
      conversations.forEach(conversation => {
        socket.join(conversation.getId().toString());
        socket.emit(events.serverToClient.JOINED_ROOM, { conversationId: conversation.getId() });
      });
    }

    next();
  });

  io.on('connection', (socket: socketIo.Socket) => {
    socket.on(events.clientToServer.NEW_MESSAGE, async payload => {
      const { userId } = socket;
      const { conversationId, text } = payload as { conversationId: number; text: string };
      if (!conversationId || !text) {
        return Promise.reject(new Error(errorMessages.MISSING_INFO));
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return Promise.reject(new Error(errorMessages.CONVO_DOES_NOT_EXIST));
      }

      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return Promise.reject(new Error(errorMessages.USER_NOT_IN_CONVO));
      }

      conversation.createMessage({ userId, text });
      socket
        .to(conversation.getId().toString())
        .emit(events.serverToClient.NEW_MESSAGE, { conversationId, userId, text });
    });

    socket.on(events.clientToServer.JOIN_ROOM, async payload => {
      const { userId } = socket;
      const { conversationId } = payload as { conversationId: number };

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return Promise.reject(new Error(errorMessages.CONVO_DOES_NOT_EXIST));
      }

      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return Promise.reject(errorMessages.USER_NOT_IN_CONVO);
      }

      socket.join(conversationId.toString());
      socket.emit(events.serverToClient.JOINED_ROOM, { conversationId });
    });

    socket.on(events.clientToServer.LEAVE_ROOM, async payload => {
      const { conversationId } = payload as { conversationId: number };

      socket.leave(conversationId.toString());
      socket.emit(events.serverToClient.LEFT_ROOM, { conversationId });
    });
  });
};

export default socketHandlers;
