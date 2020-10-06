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

  let conversationToCreateId: number;
  let conversationToGet: Conversation;
  let conversationToUpdate: Conversation;
  let conversationToCreateMessagesIn: Conversation;
  let conversationToGetMessagesFrom: Conversation;
  let conversationToAddUserIn: Conversation;
  let conversationToRemoveUserFrom: Conversation;

  let messageToCreateId: number;
  const messageToCreate = {
    text: 'message to create',
  };

  const messageToGet1 = { text: uuid.v4() };
  const messageToGet2 = { text: uuid.v4() };

  beforeAll(async () => {
    testUser1 = await utils.createTestUser();
    testUser2 = await utils.createTestUser();

    jsonWebToken1 = await utils.getJsonWebToken(app, testUser1.userName, testUser1.password);
    jsonWebToken2 = await utils.getJsonWebToken(app, testUser2.userName, testUser2.password);

    conversationToGet = await utils.createTestConversation();
    conversationToUpdate = await utils.createTestConversation();
    conversationToCreateMessagesIn = await utils.createTestConversation();
    conversationToGetMessagesFrom = await utils.createTestConversation();
    conversationToAddUserIn = await utils.createTestConversation();
    conversationToRemoveUserFrom = await utils.createTestConversation();

    await conversationToGet.addUser(testUser1.id);
    await conversationToUpdate.addUser(testUser1.id);
    await conversationToCreateMessagesIn.addUser(testUser1.id);
    await conversationToGetMessagesFrom.addUser(testUser1.id);
    await conversationToAddUserIn.addUser(testUser1.id);
    await conversationToRemoveUserFrom.addUser(testUser1.id);

    await conversationToGetMessagesFrom.createMessage({ ...messageToGet1, userId: testUser1.id });
    await conversationToGetMessagesFrom.createMessage({ ...messageToGet2, userId: testUser1.id });
  });

  afterAll(async () => {
    const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();
    await Promise.all([
      mySQLDatabaseAccess.deleteConversation(conversationToCreateId),
      mySQLDatabaseAccess.deleteConversation(conversationToGet.getId()),
      mySQLDatabaseAccess.deleteConversation(conversationToUpdate.getId()),
      mySQLDatabaseAccess.deleteConversation(conversationToCreateMessagesIn.getId()),
      mySQLDatabaseAccess.deleteConversation(conversationToGetMessagesFrom.getId()),
      mySQLDatabaseAccess.deleteConversation(conversationToAddUserIn.getId()),
      mySQLDatabaseAccess.deleteConversation(conversationToRemoveUserFrom.getId()),
      mySQLDatabaseAccess.deleteUser(testUser1.id),
      mySQLDatabaseAccess.deleteUser(testUser2.id),
    ]);
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

      conversationToCreateId = response.body?.data?.id;
      const conversation = await Conversation.findById(conversationToCreateId);
      expect(conversation).not.toBeNull();
    });
  });

  describe('GET /api/conversation/:conversationId', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).get(`/api/conversation/${conversationToGet.getId()}`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${conversationToGet.getId()}`)
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
        .get(`/api/conversation/${conversationToGet.getId()}`)
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        name: conversationToGet.getName(),
        id: conversationToGet.getId(),
      });
    });
  });

  describe('PATCH /api/conversation/:conversationId', () => {
    const fieldsToUpdate = {
      name: 'updated conversation name',
    };

    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).patch(`/api/conversation/${conversationToUpdate.getId()}`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${conversationToGet.getId()}`)
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
        .patch(`/api/conversation/${conversationToUpdate.getId()}`)
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ fieldsToUpdate });
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        name: fieldsToUpdate.name,
        id: conversationToUpdate.getId(),
      });
    });
  });

  describe('POST /api/conversation/:conversationId/message', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).post(`/api/conversation/${conversationToCreateMessagesIn.getId()}/message`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .post(`/api/conversation/${conversationToCreateMessagesIn.getId()}/message`)
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
        .post(`/api/conversation/${conversationToCreateMessagesIn.getId()}/message`)
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ message: messageToCreate });
      expect(response.status).toBe(201);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        conversationId: conversationToCreateMessagesIn.getId(),
        userId: testUser1.id,
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
      const response = await request(app).get(`/api/conversation/${conversationToGetMessagesFrom.getId()}/messages`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${conversationToGetMessagesFrom.getId()}/messages`)
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
        .get(`/api/conversation/${conversationToGetMessagesFrom.getId()}/messages`)
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual([
        {
          id: expect.any(Number),
          userId: testUser1.id,
          conversationId: conversationToGetMessagesFrom.getId(),
          text: messageToGet1.text,
        },
        {
          id: expect.any(Number),
          userId: testUser1.id,
          conversationId: conversationToGetMessagesFrom.getId(),
          text: messageToGet2.text,
        },
      ]);
    });
  });

  describe('GET /api/conversation/:conversationId/members', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).get(`/api/conversation/${conversationToGet.getId()}/members`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .get(`/api/conversation/${conversationToGet.getId()}/members`)
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
        .get(`/api/conversation/${conversationToGet.getId()}/members`)
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
        .post(`/api/conversation/${conversationToAddUserIn.getId()}/member`)
        .send({ userIdToAdd: testUser2.id });
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .post(`/api/conversation/${conversationToAddUserIn.getId()}/member`)
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
        .post(`/api/conversation/${conversationToAddUserIn.getId()}/member`)
        .set('Authorization', `Bearer ${jsonWebToken1}`)
        .send({ userIdToAdd: testUser2.id });
      expect(response.status).toBe(201);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual('User added to conversation');

      const conversation = await Conversation.findById(conversationToAddUserIn.getId());
      const conversationMembers = await conversation.getUsers();
      expect(conversationMembers.length).toBe(2);
    });
  });

  describe('DELETE /api/conversation/:conversationId/member', () => {
    it('should return 401 when requesting without a valid JSON web token', async () => {
      const response = await request(app).delete(`/api/conversation/${conversationToRemoveUserFrom.getId()}/member`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting as a user not in the conversation', async () => {
      const response = await request(app)
        .delete(`/api/conversation/${conversationToRemoveUserFrom.getId()}/member`)
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
        .delete(`/api/conversation/${conversationToRemoveUserFrom.getId()}/member`)
        .set('Authorization', `Bearer ${jsonWebToken1}`);
      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual('User removed from conversation');

      const conversation = await Conversation.findById(conversationToRemoveUserFrom.getId());
      const conversationMembers = await conversation.getUsers();
      const conversationMemberIds = conversationMembers.map(user => user.getId());
      expect(conversationMemberIds).not.toContain(testUser1.id);
    });
  });
});
