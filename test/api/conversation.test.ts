import request from 'supertest';
import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import app from '../../src/app';
import Conversation from '../../src/models/Conversation';
import Message from '../../src/models/Message';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';
import * as utils from '../utils';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database for tests

describe('Conversation API', () => {
  let testUser1: utils.UserInfo;
  let testUser2: utils.UserInfo;

  let jsonWebToken1: string;
  let jsonWebToken2: string;

  let testConversation: Conversation;
  let createdConversationId: number;

  let createdMessageId: number;
  let testMessage1: Message;
  let testMessage2: Message;

  beforeEach(async () => {
    testUser1 = await utils.createTestUser();
    testUser2 = await utils.createTestUser();

    jsonWebToken1 = await utils.getJsonWebToken(app, testUser1.userName, testUser1.password);
    jsonWebToken2 = await utils.getJsonWebToken(app, testUser2.userName, testUser2.password);

    testConversation = await utils.createTestConversation();
    await testConversation.addUser(testUser1.id);

    testMessage1 = await testConversation.createMessage({ text: uuid.v4(), userId: testUser1.id });
    testMessage2 = await testConversation.createMessage({ text: uuid.v4(), userId: testUser1.id });
  });

  afterEach(async () => {
    const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();
    await mySQLDatabaseAccess.deleteConversation(testConversation.getId());
    await mySQLDatabaseAccess.deleteConversation(createdConversationId);
  });

  describe('POST /api/conversation', () => {
    const conversationConfig = { name: uuid.v4() };

    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app)
        .post('/api/conversation')
        .send({ conversation: conversationConfig });
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
        .send({ conversation: conversationConfig });

      expect(response.status).toBe(201);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).not.toBeNull();
      expect(response.body?.data).toStrictEqual({
        name: conversationConfig.name,
        id: expect.any(Number),
      });

      createdConversationId = response.body?.data?.id;
      const conversation = await Conversation.findById(createdConversationId);
      expect(conversation).not.toBeNull();
    });
  });

  describe('GET /api/conversation/:conversationId', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).get(`/api/conversation/${testConversation.getId()}`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${testConversation.getId()}`)
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
        .get(`/api/conversation/${testConversation.getId()}`)
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        name: testConversation.getName(),
        id: testConversation.getId(),
      });
    });
  });

  describe('PATCH /api/conversation/:conversationId', () => {
    const fieldsToUpdate = {
      name: 'updated conversation name',
    };

    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).patch(`/api/conversation/${testConversation.getId()}`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${testConversation.getId()}`)
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
        .patch(`/api/conversation/${testConversation.getId()}`)
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ fieldsToUpdate });
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        name: fieldsToUpdate.name,
        id: testConversation.getId(),
      });
    });
  });

  describe('POST /api/conversation/:conversationId/message', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).post(`/api/conversation/${testConversation.getId()}/message`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const messageConfig = { text: uuid.v4() };
      const response = await request(app)
        .post(`/api/conversation/${testConversation.getId()}/message`)
        .set('Authorization', `Bearer ${jsonWebToken2}`)
        .send({ message: messageConfig });
      expect(response.status).toBe(403);
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting with an invalid conversationId', async () => {
      const messageConfig = { text: uuid.v4() };
      const response = await request(app)
        .post('/api/conversation/shouldBeANumber/message')
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ message: messageConfig });
      expect(response.status).toBe(400);
      expect(response.body?.data).toBeNull();
    });

    it('should return 201 and create a message in the conversation', async () => {
      const messageConfig = { text: uuid.v4() };
      const response = await request(app)
        .post(`/api/conversation/${testConversation.getId()}/message`)
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ message: messageConfig });
      expect(response.status).toBe(201);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        conversationId: testConversation.getId(),
        userId: testUser1.id,
        text: messageConfig.text,
        id: expect.any(Number),
      });

      createdMessageId = response.body?.data?.id;
      const createdMessage = await Message.findById(createdMessageId);
      expect(createdMessage).toBeInstanceOf(Message);
    });
  });

  describe('GET /api/conversation/:conversationId/messages', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).get(`/api/conversation/${testConversation.getId()}/messages`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${testConversation.getId()}/messages`)
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

    it('should return 200 with messages in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${testConversation.getId()}/messages`)
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual([
        {
          id: expect.any(Number),
          userId: testUser1.id,
          conversationId: testConversation.getId(),
          text: testMessage1.getText(),
        },
        {
          id: expect.any(Number),
          userId: testUser1.id,
          conversationId: testConversation.getId(),
          text: testMessage2.getText(),
        },
      ]);
    });
  });

  describe('GET /api/conversation/:conversationId/members', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).get(`/api/conversation/${testConversation.getId()}/members`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${testConversation.getId()}/members`)
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

    it('should return 200 with users in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${testConversation.getId()}/members`)
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual([
        {
          id: testUser1.id,
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
        .post(`/api/conversation/${testConversation.getId()}/member`)
        .send({ userIdToAdd: testUser2.id });
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .post(`/api/conversation/${testConversation.getId()}/member`)
        .set('Authorization', `Bearer ${jsonWebToken2}`)
        .send({ userIdToAdd: testUser2.id });
      expect(response.status).toBe(403);
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting with an invalid conversationId', async () => {
      const response = await request(app)
        .post('/api/conversation/shouldBeANumber/member')
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ userIdToAdd: testUser2.id });
      expect(response.status).toBe(400);
      expect(response.body?.data).toBeNull();
    });

    it('should return 201 and add a user to the conversation', async () => {
      const response = await request(app)
        .post(`/api/conversation/${testConversation.getId()}/member`)
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ userIdToAdd: testUser2.id });
      expect(response.status).toBe(201);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual('User added to conversation');

      const conversation = await Conversation.findById(testConversation.getId());
      const conversationMembers = await conversation?.getUsers();
      expect(conversationMembers?.length).toBe(2);
    });
  });

  describe('DELETE /api/conversation/:conversationId/member', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).delete(`/api/conversation/${testConversation.getId()}/member`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .delete(`/api/conversation/${testConversation.getId()}/member`)
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
        .delete(`/api/conversation/${testConversation.getId()}/member`)
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual('User removed from conversation');

      const conversation = await Conversation.findById(testConversation.getId());
      const conversationMembers = await conversation?.getUsers();
      const conversationMemberIds = conversationMembers?.map(user => user.getId());
      expect(conversationMemberIds).not.toContain(testUser1.id);
    });
  });
});
