import socketIo from 'socket.io';
import jwt from 'jsonwebtoken';

import { ErrorMessage } from '../types/types';
import User from '../models/User';
import Conversation from '../models/Conversation';

class SocketServer {
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
  private jwtKey: string;

  constructor(io: socketIo.Server) {
    this.io = io;

    const jwtKey = process.env.JWT_KEY;
    if (!jwtKey) {
      throw new Error(ErrorMessage.MISSING_JWT_KEY);
    }

    this.jwtKey = jwtKey;
  }

  authenticateSocket = async (socket: socketIo.Socket, next: (err?: unknown) => void): Promise<void> => {
    if (!socket.handshake?.query?.token) {
      socket.disconnect();
      return;
    }

    const payload = jwt.verify(socket.handshake.query.token, this.jwtKey);
    const { userName, userId } = payload as { userName: string; userId: number };
    if (!userName || !userId) {
      socket.disconnect();
      return;
    }

    if (!socket.isAuthenticated) {
      socket.isAuthenticated = true;
      socket.userId = userId;
      socket.emit(SocketServer.events.AUTHENTICATED);

      const user = await User.findById(userId);

      const conversations = await user?.getConversations();
      conversations?.forEach(conversation => {
        socket.join(conversation.getId().toString());
        socket.emit(SocketServer.events.JOINED_ROOM, { conversationId: conversation.getId() });
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

    if (!userId) {
      return new Error(ErrorMessage.UNAUTHORIZED);
    }

    if (!conversationId || !text) {
      return new Error(ErrorMessage.MISSING_INFO);
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return new Error(ErrorMessage.CONVO_DOES_NOT_EXIST);
    }

    const isUserInConversation = await conversation.checkIfHasUser(userId);
    if (!isUserInConversation) {
      return new Error(ErrorMessage.USER_NOT_IN_CONVO);
    }

    conversation.createMessage({ userId, text });
    socket.to(conversation.getId().toString()).emit(SocketServer.events.NEW_MESSAGE, { conversationId, userId, text });
  };

  handleJoinRoom = async (socket: socketIo.Socket, payload: { conversationId: number }): Promise<Error | void> => {
    const { userId } = socket;
    const { conversationId } = payload;

    if (!userId) {
      return new Error(ErrorMessage.UNAUTHORIZED);
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return new Error(ErrorMessage.CONVO_DOES_NOT_EXIST);
    }

    const isUserInConversation = await conversation.checkIfHasUser(userId);
    if (!isUserInConversation) {
      return new Error(ErrorMessage.USER_NOT_IN_CONVO);
    }

    socket.join(conversationId.toString());
    socket.emit(SocketServer.events.JOINED_ROOM, { conversationId });
  };

  handleLeaveRoom = async (socket: socketIo.Socket, payload: { conversationId: number }): Promise<Error | void> => {
    const { conversationId } = payload;

    socket.leave(conversationId.toString());
    socket.emit(SocketServer.events.LEFT_ROOM, { conversationId });
  };

  handleConnection = async (socket: socketIo.Socket): Promise<void> => {
    socket.on(SocketServer.events.NEW_MESSAGE, payload => {
      this.handleNewMessage(socket, payload);
    });

    socket.on(SocketServer.events.JOIN_ROOM, payload => {
      this.handleJoinRoom(socket, payload);
    });

    socket.on(SocketServer.events.LEAVE_ROOM, payload => {
      this.handleLeaveRoom(socket, payload);
    });
  };

  addHandlers(): void {
    this.io.use(this.authenticateSocket);
    this.io.on(SocketServer.events.CONNECTION, this.handleConnection);
  }
}

export default SocketServer;
