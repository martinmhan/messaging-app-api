import socketIo from 'socket.io';
import jwt from 'jsonwebtoken';

import User from '../models/User';
import Conversation from '../models/Conversation';

const jwtKey = process.env.JWT_KEY;

if (!jwtKey) {
  throw new Error('Missing required JWT_KEY environment variable. Please edit .env file');
}

const socketHandlers = (io: socketIo.Server): void => {
  io.use(async (socket, next) => {
    if (!socket.handshake.query.token) {
      return next(new Error('Socket authentication failed - no token provided'));
    }

    const { token } = socket.handshake.query;
    const payload = jwt.verify(token, jwtKey);
    const { userName, userId } = payload as { userName: string; userId: number };
    if (!userName || !userId) {
      return next(new Error('Socket authentication failed - invalid token'));
    }

    if (!socket.isAuthenticated) {
      socket.isAuthenticated = true;
      socket.userId = userId;

      const user = await User.findById(userId);
      const conversations = await user.getConversations();
      conversations.forEach(conversation => {
        socket.join(conversation.getId().toString());
      });
    }

    next();
  });

  io.on('connection', (socket: socketIo.Socket) => {
    socket.on('newMessage', async payload => {
      const { userId } = socket;
      const conversationId: number = payload.conversationId;
      const text: string = payload.text;

      const conversation = await Conversation.findById(conversationId);
      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return Promise.reject('User is not a member of this conversation');
      }

      conversation.createMessage({ userId, text });
      socket.to(conversation.getId().toString()).emit('newMessage', { conversationId, userId, text });
    });

    socket.on('joinConversation', async payload => {
      const { userId } = socket;
      const { conversationId } = payload as { conversationId: number };
      const conversation = await Conversation.findById(conversationId);
      const isUserInConversation = await conversation.checkIfHasUser(userId);
      if (!isUserInConversation) {
        return Promise.reject('User is not a member of this conversation');
      }

      socket.join(conversationId.toString());
    });

    socket.on('leaveConversation', async payload => {
      const { conversationId } = payload;
      socket.leave(conversationId.toString());
    });
  });
};

export default socketHandlers;
