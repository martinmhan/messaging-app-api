import request from 'supertest';
import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import app from '../../src/app';
import User from '../../src/models/User';
import Conversation from '../../src/models/Conversation';
import Message from '../../src/models/Message';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database for tests

describe('Conversation API', () => {
  let testUserId1: number;
  let testUserId2: number;
  let jsonWebToken1: string;
  let jsonWebToken2: string;
  const testUser1 = {
    userName: `thor${uuid.v4()}`,
    password: 'forasgard',
    firstName: 'Thor',
    lastName: 'Odinson',
    email: `thor${uuid.v4()}@asgard.com`,
  };
  const testUser2 = {
    userName: `ironman${uuid.v4()}`,
    password: 'iloveyou3000',
    firstName: 'Tony',
    lastName: 'Stark',
    email: `ironman${uuid.v4()}@starkindustries.com`,
  };

  let conversationToCreateId: number;
  let conversationToGetId: number;
  let conversationToUpdateId: number;
  let conversationToCreateMessagesInId: number;
  let conversationToGetMessagesFromId: number;
  let conversationToAddUserInId: number;
  let conversationToRemoveUserFromId: number;
  const conversationToCreate = {
    name: 'conversation to create',
  };
  const conversationToGet = {
    name: 'conversation to get',
  };
  const conversationToUpdate = {
    name: 'conversation to update',
  };
  const conversationToCreateMessagesIn = {
    name: 'conversation to create messages in',
  };
  const conversationToGetMessagesFrom = {
    name: 'conversation to get messages from',
  };
  const conversationToAddUserIn = {
    name: 'conversation to add user in',
  };
  const conversationToRemoveUserFrom = {
    name: 'conversation to remove user from',
  };

  let messageToCreateId: number;
  const messageToCreate = {
    text: 'message to create',
  };

  const messageToGet1 = {
    text: 'message to get 1',
  };
  const messageToGet2 = {
    text: 'message to get 2',
  };

  beforeAll(async () => {
    const user1 = await User.create(testUser1);
    const user2 = await User.create(testUser2);
    testUserId1 = user1.getId();
    testUserId2 = user2.getId();

    const userNamePassword1 = `${testUser1.userName}:${testUser1.password}`;
    const userNamePassword2 = `${testUser2.userName}:${testUser2.password}`;
    const userNamePasswordEncoded1 = Buffer.from(userNamePassword1).toString('base64');
    const userNamePasswordEncoded2 = Buffer.from(userNamePassword2).toString('base64');
    const authorizationHeader1 = `Basic ${userNamePasswordEncoded1}`;
    const authorizationHeader2 = `Basic ${userNamePasswordEncoded2}`;

    const [loginResponse1, loginResponse2] = await Promise.all([
      request(app)
        .post('/api/user/login')
        .set('Authorization', authorizationHeader1),
      request(app)
        .post('/api/user/login')
        .set('Authorization', authorizationHeader2),
    ]);

    jsonWebToken1 = loginResponse1.body?.data?.jsonWebToken;
    jsonWebToken2 = loginResponse2.body?.data?.jsonWebToken;

    const convoToGet = await Conversation.create(conversationToGet);
    const convoToUpdate = await Conversation.create(conversationToUpdate);
    const convoToCreateMessagesIn = await Conversation.create(conversationToCreateMessagesIn);
    const convoToGetMessagesFrom = await Conversation.create(conversationToGetMessagesFrom);
    const convoToAddUserIn = await Conversation.create(conversationToAddUserIn);
    const convoToRemoveUserFrom = await Conversation.create(conversationToRemoveUserFrom);
    conversationToGetId = convoToGet.getId();
    conversationToUpdateId = convoToUpdate.getId();
    conversationToCreateMessagesInId = convoToCreateMessagesIn.getId();
    conversationToGetMessagesFromId = convoToGetMessagesFrom.getId();
    conversationToAddUserInId = convoToAddUserIn.getId();
    conversationToRemoveUserFromId = convoToRemoveUserFrom.getId();

    await convoToGet.addUser(testUserId1);
    await convoToUpdate.addUser(testUserId1);
    await convoToCreateMessagesIn.addUser(testUserId1);
    await convoToGetMessagesFrom.addUser(testUserId1);
    await convoToAddUserIn.addUser(testUserId1);
    await convoToRemoveUserFrom.addUser(testUserId1);

    await convoToGetMessagesFrom.createMessage({ ...messageToGet1, userId: testUserId1 });
    await convoToGetMessagesFrom.createMessage({ ...messageToGet2, userId: testUserId1 });
  });

  afterAll(async () => {
    const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();
    await Promise.all([
      mySQLDatabaseAccess.deleteConversation(conversationToCreateId),
      mySQLDatabaseAccess.deleteConversation(conversationToGetId),
      mySQLDatabaseAccess.deleteConversation(conversationToUpdateId),
      mySQLDatabaseAccess.deleteConversation(conversationToCreateMessagesInId),
      mySQLDatabaseAccess.deleteConversation(conversationToGetMessagesFromId),
      mySQLDatabaseAccess.deleteConversation(conversationToAddUserInId),
      mySQLDatabaseAccess.deleteConversation(conversationToRemoveUserFromId),
      mySQLDatabaseAccess.deleteUser(testUserId1),
      mySQLDatabaseAccess.deleteUser(testUserId2),
    ]);
  });

  describe('POST /api/conversation', () => {
    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app)
        .post('/api/conversation')
        .send({ conversation: conversationToCreate });
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 400 if a required field is missing', async () => {
      const response = await request(app)
        .post('/api/conversation')
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ conversation: {} });

      expect(response.status).toBe(400);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should return 201 and create a conversation', async () => {
      const response = await request(app)
        .post('/api/conversation')
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ conversation: conversationToCreate });

      expect(response.status).toBe(201);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).not.toBeNull();
      expect(response.body?.data).toStrictEqual({
        name: conversationToCreate.name,
        id: expect.any(Number),
      });

      conversationToCreateId = response.body?.data?.id;
      const conversation = await Conversation.findById(conversationToCreateId);
      expect(conversation).not.toBeNull();
    });
  });

  describe('GET /api/conversation/:conversationId', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).get(`/api/conversation/${conversationToGetId}`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${conversationToGetId}`)
        .set('Authorization', `Bearer ${jsonWebToken2}`);
      expect(response.status).toBe(403);
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting with an invalid conversationId', async () => {
      const response = await request(app)
        .get('/api/conversation/shouldBeANumber')
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(400);
      expect(response.body?.data).toBeNull();
    });

    it('should return 200 with info on an existing conversation that the user is a member of', async () => {
      const response = await request(app)
        .get(`/api/conversation/${conversationToGetId}`)
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        name: conversationToGet.name,
        id: conversationToGetId,
      });
    });
  });

  describe('PATCH /api/conversation/:conversationId', () => {
    const fieldsToUpdate = {
      name: 'updated conversation name',
    };

    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).patch(`/api/conversation/${conversationToUpdateId}`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${conversationToGetId}`)
        .set('Authorization', `Bearer ${jsonWebToken2}`);
      expect(response.status).toBe(403);
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting with an invalid conversationId', async () => {
      const response = await request(app)
        .get('/api/conversation/shouldBeANumber')
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(400);
      expect(response.body?.data).toBeNull();
    });

    it('should return 200 with info on an existing conversation that the user is a member of', async () => {
      const response = await request(app)
        .patch(`/api/conversation/${conversationToUpdateId}`)
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ fieldsToUpdate });
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        name: fieldsToUpdate.name,
        id: conversationToUpdateId,
      });
    });
  });

  describe('POST /api/conversation/:conversationId/message', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).post(`/api/conversation/${conversationToCreateMessagesInId}/message`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .post(`/api/conversation/${conversationToCreateMessagesInId}/message`)
        .set('Authorization', `Bearer ${jsonWebToken2}`)
        .send({ message: messageToCreate });
      expect(response.status).toBe(403);
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting with an invalid conversationId', async () => {
      const response = await request(app)
        .post('/api/conversation/shouldBeANumber/message')
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ message: messageToCreate });
      expect(response.status).toBe(400);
      expect(response.body?.data).toBeNull();
    });

    it('should return 201 and create a message in the conversation', async () => {
      const response = await request(app)
        .post(`/api/conversation/${conversationToCreateMessagesInId}/message`)
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ message: messageToCreate });
      expect(response.status).toBe(201);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        conversationId: conversationToCreateMessagesInId,
        userId: testUserId1,
        text: messageToCreate.text,
        id: expect.any(Number),
      });

      messageToCreateId = response.body?.data?.id;
      const createdMessage = await Message.findById(messageToCreateId);
      expect(createdMessage).toBeInstanceOf(Message);
    });
  });

  describe('GET /api/conversation/:conversationId/messages', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).get(`/api/conversation/${conversationToGetMessagesFromId}/messages`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${conversationToGetMessagesFromId}/messages`)
        .set('Authorization', `Bearer ${jsonWebToken2}`);
      expect(response.status).toBe(403);
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting with an invalid conversationId', async () => {
      const response = await request(app)
        .get('/api/conversation/shouldBeANumber/messages')
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(400);
      expect(response.body?.data).toBeNull();
    });

    it('should return 200 and with messages in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${conversationToGetMessagesFromId}/messages`)
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual([
        {
          id: expect.any(Number),
          userId: testUserId1,
          conversationId: conversationToGetMessagesFromId,
          text: 'message to get 1',
        },
        {
          id: expect.any(Number),
          userId: testUserId1,
          conversationId: conversationToGetMessagesFromId,
          text: 'message to get 2',
        },
      ]);
    });
  });

  describe('GET /api/conversation/:conversationId/members', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).get(`/api/conversation/${conversationToGetId}/members`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${conversationToGetId}/members`)
        .set('Authorization', `Bearer ${jsonWebToken2}`);
      expect(response.status).toBe(403);
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting with an invalid conversationId', async () => {
      const response = await request(app)
        .get('/api/conversation/shouldBeANumber/members')
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(400);
      expect(response.body?.data).toBeNull();
    });

    it('should return 200 and with users in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${conversationToGetId}/members`)
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual([
        {
          id: testUserId1,
          userName: testUser1.userName,
          firstName: testUser1.firstName,
          lastName: testUser1.lastName,
          email: testUser1.email,
        },
      ]);
    });
  });

  describe('POST /api/conversation/:conversationId/member', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app)
        .post(`/api/conversation/${conversationToAddUserInId}/member`)
        .send({ userIdToAdd: testUserId2 });
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .post(`/api/conversation/${conversationToAddUserInId}/member`)
        .set('Authorization', `Bearer ${jsonWebToken2}`)
        .send({ userIdToAdd: testUserId2 });
      expect(response.status).toBe(403);
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting with an invalid conversationId', async () => {
      const response = await request(app)
        .post('/api/conversation/shouldBeANumber/member')
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ userIdToAdd: testUserId2 });
      expect(response.status).toBe(400);
      expect(response.body?.data).toBeNull();
    });

    it('should return 201 and add a user to the conversation', async () => {
      const response = await request(app)
        .post(`/api/conversation/${conversationToAddUserInId}/member`)
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ userIdToAdd: testUserId2 });
      expect(response.status).toBe(201);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual('User added to conversation');

      const conversation = await Conversation.findById(conversationToAddUserInId);
      const conversationMembers = await conversation.getUsers();
      expect(conversationMembers.length).toBe(2);
    });
  });

  describe('DELETE /api/conversation/:conversationId/member', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).delete(`/api/conversation/${conversationToRemoveUserFromId}/member`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .delete(`/api/conversation/${conversationToRemoveUserFromId}/member`)
        .set('Authorization', `Bearer ${jsonWebToken2}`);
      expect(response.status).toBe(403);
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting with an invalid conversationId', async () => {
      const response = await request(app)
        .delete('/api/conversation/shouldBeANumber/member')
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(400);
      expect(response.body?.data).toBeNull();
    });

    it('should return 201 and remove a user from the conversation', async () => {
      const response = await request(app)
        .delete(`/api/conversation/${conversationToRemoveUserFromId}/member`)
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual('User removed from conversation');

      const conversation = await Conversation.findById(conversationToRemoveUserFromId);
      const conversationMembers = await conversation.getUsers();
      const conversationMemberIds = conversationMembers.map(user => user.getId());
      expect(conversationMemberIds).not.toContain(testUserId1);
    });
  });
});
