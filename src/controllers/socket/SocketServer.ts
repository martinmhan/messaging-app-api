import socketIo from 'socket.io';
import jwt from 'jsonwebtoken';

import * as types from '../../types/types';
import User from '../../models/User';
import Conversation from '../../models/Conversation';

const jwtKey = process.env.JWT_KEY;

if (!jwtKey) {
  throw new Error('Missing required JWT_KEY environment variable. Please edit .env file');
}

class SocketServerContainer {
  private static events = {
    // server to client
    AUTHENTICATED: 'authenticated',
    JOINED_ROOM: 'joinedRoom',
    LEFT_ROOM: 'leftRoom',

    // client to server
    CONNECTION: 'connection',
    JOIN_ROOM: 'joinRoom',
    LEAVE_ROOM: 'leaveRoom',

    // bi-directional
    NEW_MESSAGE: 'newMessage',
  };

  private io: socketIo.Server;

  constructor(io: socketIo.Server) {
    this.io = io;
  }

  authenticateSocket = async (socket: socketIo.Socket, next: (err?: unknown) => void): Promise<socketIo.Socket> => {
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
      socket.emit(SocketServerContainer.events.AUTHENTICATED);

      const user = await User.findById(userId);
      const conversations = await user.getConversations();
      conversations.forEach(conversation => {
        socket.join(conversation.getId().toString());
        socket.emit(SocketServerContainer.events.JOINED_ROOM, { conversationId: conversation.getId() });
      });
    }

    next();
  };

  handleNewMessage = async (
    socket: socketIo.Socket,
    payload: { conversationId: number; text: string },
  ): Promise<Error | void> => {
    const { userId } = socket;
    const { conversationId, text } = payload;

    if (!conversationId || !text) {
      return new Error(types.ErrorMessage.MISSING_INFO);
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return new Error(types.ErrorMessage.CONVO_DOES_NOT_EXIST);
    }

    const isUserInConversation = await conversation.checkIfHasUser(userId);
    if (!isUserInConversation) {
      return new Error(types.ErrorMessage.USER_NOT_IN_CONVO);
    }

    conversation.createMessage({ userId, text });
    socket
      .to(conversation.getId().toString())
      .emit(SocketServerContainer.events.NEW_MESSAGE, { conversationId, userId, text });
  };

  handleJoinRoom = async (socket: socketIo.Socket, payload: { conversationId: number }): Promise<Error | void> => {
    const { userId } = socket;
    const { conversationId } = payload;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return new Error(types.ErrorMessage.CONVO_DOES_NOT_EXIST);
    }

    const isUserInConversation = await conversation.checkIfHasUser(userId);
    if (!isUserInConversation) {
      return new Error(types.ErrorMessage.USER_NOT_IN_CONVO);
    }

    socket.join(conversationId.toString());
    socket.emit(SocketServerContainer.events.JOINED_ROOM, { conversationId });
  };

  handleLeaveRoom = async (socket: socketIo.Socket, payload: { conversationId: number }): Promise<Error | void> => {
    const { conversationId } = payload;

    socket.leave(conversationId.toString());
    socket.emit(SocketServerContainer.events.LEFT_ROOM, { conversationId });
  };

  handleConnection = async (socket: socketIo.Socket): Promise<void> => {
    socket.on(SocketServerContainer.events.NEW_MESSAGE, payload => {
      this.handleNewMessage(socket, payload);
    });

    socket.on(SocketServerContainer.events.JOIN_ROOM, payload => {
      this.handleJoinRoom(socket, payload);
    });

    socket.on(SocketServerContainer.events.LEAVE_ROOM, payload => {
      this.handleLeaveRoom(socket, payload);
    });
  };

  addHandlers(): void {
    this.io.use(this.authenticateSocket);
    this.io.on(SocketServerContainer.events.CONNECTION, this.handleConnection);
  }
}

export default SocketServerContainer;
