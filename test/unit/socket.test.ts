import socketIo from 'socket.io';
import socketIoClient from 'socket.io-client';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

import app from '../../src/app';
import User from '../../src/models/User';
import SocketServerContainer from '../../src/controllers/socket/SocketServer';
import Conversation from '../../src/models/Conversation';
import * as utils from '../utils';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database

describe('Web Socket Events', () => {
  const PORT = process.env.PORT || 8080;
  const server = http.createServer(app);
  const io = socketIo(server);
  const socketServer = new SocketServerContainer(io);
  socketServer.addHandlers();

  server.listen(PORT);

  let user1: utils.UserInfo;
  let user2: utils.UserInfo;

  let jsonWebToken1: string;
  let jsonWebToken2: string;

  let conversation1: Conversation;
  let conversation2: Conversation;

  let socket1: SocketIOClient.Socket;
  let socket2: SocketIOClient.Socket;

  beforeAll(async () => {
    user1 = await utils.createTestUser();
    user2 = await utils.createTestUser();

    jsonWebToken1 = await utils.getJsonWebToken(app, user1.userName, user1.password);
    jsonWebToken2 = await utils.getJsonWebToken(app, user2.userName, user2.password);

    conversation1 = await utils.createTestConversation();
    conversation2 = await utils.createTestConversation();

    await conversation1.addUser(user1.id);
    await conversation1.addUser(user2.id);
  });

  afterAll(async () => {
    const user = await User.findById(user1.id);
    await user.delete();
    server.close();
  });

  beforeEach(async () => {
    socket1 = socketIoClient(`http://localhost:${PORT}`, { query: { token: jsonWebToken1 } });
    socket2 = socketIoClient(`http://localhost:${PORT}`, { query: { token: jsonWebToken2 } });
  });

  afterEach(() => {
    socket1.disconnect();
    socket2.disconnect();
  });

  describe('Authentication', () => {
    it('should automatically disconnect sockets without a valid JSON web token', done => {
      const socket = socketIoClient(`http://localhost:${PORT}`);
      socket.on('disconnect', () => {
        done();
      });
    });

    it("should send an 'authenticated' event to socket connections with a valid JSON web token", done => {
      const socket = socketIoClient(`http://localhost:${PORT}`, { query: { token: jsonWebToken1 } });
      socket.on('authenticated', () => {
        done();
      });
    });

    it('should automatically join rooms a connected socket is a conversation member of', done => {
      const socket = socketIoClient(`http://localhost:${PORT}`, { query: { token: jsonWebToken1 } });
      socket.on('joinedRoom', (payload: { conversationId: number }) => {
        expect(payload.conversationId).toEqual(conversation1.getId());
        done();
      });
    });
  });

  describe('Messages', () => {
    it('should broadcast a new message to other sockets connected to the same room', done => {
      const newMessage = {
        conversationId: conversation1.getId(),
        text: 'hello world',
      };

      socket1.emit('newMessage', newMessage);
      socket2.on('newMessage', (payload: { conversationId: number; userId: number; text: string }) => {
        expect(payload.conversationId).toEqual(newMessage.conversationId);
        expect(payload.userId).toEqual(user1.id);
        expect(payload.text).toEqual(newMessage.text);
        done();
      });
    });
  });

  describe('Join Conversation', () => {
    it('should not allow a socket to join a room if the user is not a member of the conversation', done => {
      socket1.emit('joinRoom', { conversationId: conversation2.getId() });
      socket1.on('joinedRoom', (payload: { conversationId: number }) => {
        if (payload.conversationId === conversation2.getId()) {
          expect(true).toBe(false);
        }
      });

      setTimeout(done, 1000);
    });

    it('should not join a room if an invalid conversationId is provided', done => {
      const invalidConversationId = -1;
      socket1.emit('joinRoom', { conversationId: invalidConversationId });
      socket1.on('joinedRoom', (payload: { conversationId: number }) => {
        if (payload.conversationId === invalidConversationId) {
          expect(true).toBe(false);
        }
      });

      setTimeout(done, 1000);
    });

    it('should join a socket room if the user a member of the conversation', done => {
      socket1.emit('joinRoom', { conversationId: conversation1.getId() });
      socket1.on('joinedRoom', (payload: { conversationId: number }) => {
        expect(payload.conversationId).toEqual(conversation1.getId());
        done();
      });
    });
  });

  describe('Leave Conversation', () => {
    it('should leave a socket room and no longer receive events for that room', done => {
      socket1.emit('leaveRoom', { conversationId: conversation1.getId() });
      socket1.on('leftRoom', (payload: { conversationId: number }) => {
        expect(payload.conversationId).toEqual(conversation1.getId());
      });

      socket2.emit('newMessage', { conversationId: conversation1.getId(), text: 'hi' });
      socket1.on('newMessage', () => {
        expect(true).toBe(false);
      });

      setTimeout(done, 1000);
    });
  });
});
