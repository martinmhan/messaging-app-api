import socketIo from 'socket.io';
import socketIoClient from 'socket.io-client';
import dotenv from 'dotenv';
import * as uuid from 'uuid';
import request from 'supertest';
import http from 'http';

dotenv.config();

import app from '../../src/app';
import User from '../../src/models/User';
import socketHandlers from '../../src/controllers/socket/socket';
import Conversation from '../../src/models/Conversation';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database

describe('Web Socket Events', () => {
  const PORT = process.env.PORT || 8080;
  const server = http.createServer(app);
  const io = socketIo(server);
  socketHandlers(io);
  server.listen(PORT);

  let userId1: number;
  let userId2: number;
  let jsonWebToken1: string;
  let jsonWebToken2: string;
  const user1 = {
    userName: uuid.v4(),
    password: uuid.v4(),
    firstName: uuid.v4(),
    lastName: uuid.v4(),
    email: uuid.v4(),
  };
  const user2 = {
    userName: uuid.v4(),
    password: uuid.v4(),
    firstName: uuid.v4(),
    lastName: uuid.v4(),
    email: uuid.v4(),
  };

  let testConversationId1: number;
  let testConversationId2: number;
  const testConversation1 = {
    name: uuid.v4(),
  };
  const testConversation2 = {
    name: uuid.v4(),
  };

  let socket1: SocketIOClient.Socket;
  let socket2: SocketIOClient.Socket;

  beforeAll(async () => {
    userId1 = (await User.create(user1)).getId();
    userId2 = (await User.create(user2)).getId();

    const userNamePassword1 = `${user1.userName}:${user1.password}`;
    const userNamePassword2 = `${user2.userName}:${user2.password}`;
    const userNamePasswordEncoded1 = Buffer.from(userNamePassword1).toString('base64');
    const userNamePasswordEncoded2 = Buffer.from(userNamePassword2).toString('base64');
    const authorizationHeader1 = `Basic ${userNamePasswordEncoded1}`;
    const authorizationHeader2 = `Basic ${userNamePasswordEncoded2}`;

    const loginResponse1 = await request(app)
      .post('/api/user/login')
      .set('Authorization', authorizationHeader1);
    const loginResponse2 = await request(app)
      .post('/api/user/login')
      .set('Authorization', authorizationHeader2);

    jsonWebToken1 = loginResponse1?.body?.data?.jsonWebToken;
    jsonWebToken2 = loginResponse2?.body?.data?.jsonWebToken;

    const conversation1 = await Conversation.create(testConversation1);
    const conversation2 = await Conversation.create(testConversation2);
    testConversationId1 = conversation1.getId();
    testConversationId2 = conversation2.getId();
    await conversation1.addUser(userId1);
    await conversation1.addUser(userId2);
  });

  afterAll(async () => {
    const user = await User.findById(userId1);
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
      socket.on('joinedConversationRoom', (payload: { conversationId: number }) => {
        expect(payload.conversationId).toEqual(testConversationId1);
        done();
      });
    });
  });

  describe('Messages', () => {
    it('should broadcast a new message to other sockets connected to the same room', done => {
      const newMessage = {
        conversationId: testConversationId1,
        text: 'hello world',
      };

      socket1.emit('newMessage', newMessage);
      socket2.on('newMessage', (payload: { conversationId: number; userId: number; text: string }) => {
        expect(payload.conversationId).toEqual(newMessage.conversationId);
        expect(payload.userId).toEqual(userId1);
        expect(payload.text).toEqual(newMessage.text);
        done();
      });
    });
  });

  describe('Join Conversation', () => {
    it('should not allow a socket to join a room if the user is not a member of the conversation', done => {
      socket1.emit('joinConversationRoom', { conversationId: testConversationId2 });
      socket1.on('joinedConversationRoom', (payload: { conversationId: number }) => {
        if (payload.conversationId === testConversationId2) {
          expect(true).toBe(false);
        }
      });

      setTimeout(done, 1000);
    });

    it('should join a socket room if the user a member of the conversation', done => {
      socket1.emit('joinConversationRoom', { conversationId: testConversationId1 });
      socket1.on('joinedConversationRoom', (payload: { conversationId: number }) => {
        expect(payload.conversationId).toEqual(testConversationId1);
        done();
      });
    });
  });

  describe('Leave Conversation', () => {
    it('should leave a socket room and no longer receive events for that room', done => {
      socket1.emit('leaveConversationRoom', { conversationId: testConversationId1 });
      socket1.on('leftConversationRoom', (payload: { conversationId: number }) => {
        expect(payload.conversationId).toEqual(testConversationId1);
      });

      socket2.emit('newMessage', { conversationId: testConversationId1, text: 'hi' });
      socket1.on('newMessage', () => {
        expect(true).toBe(false);
      });

      setTimeout(done, 1000);
    });
  });
});
