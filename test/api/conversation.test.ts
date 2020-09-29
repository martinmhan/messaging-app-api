import request from 'supertest';
import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import app from '../../src/app';
import User from '../../src/models/User';
import Conversation from '../../src/models/Conversation';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database for tests

describe('POST /api/conversation', () => {
  let testUserId: number;
  let jsonWebToken: string;
  const testUser = {
    userName: `batman${uuid.v4()}`,
    password: 'alfred',
    firstName: 'Bruce',
    lastName: 'Wayne',
    email: 'batman@wayneenterprises.com',
  };

  let testConversationId: number;
  const testConversation = {
    name: 'test convo',
  };

  beforeAll(async () => {
    const user = await User.create(testUser); // create user
    testUserId = user.getId();

    const userNamePassword = `${testUser.userName}:${testUser.password}`;
    const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
    const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

    const loginResponse = await request(app)
      .post('/api/user/login')
      .set('Authorization', authorizationHeader);
    jsonWebToken = loginResponse.body?.data?.jsonWebToken;
  });

  afterAll(async () => {
    const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();
    await mySQLDatabaseAccess.deleteUser(testUserId);
    await mySQLDatabaseAccess.deleteConversation(testConversationId);
    await mySQLDatabaseAccess.disconnect();
  });

  it('should return 201 and create a conversation', async () => {
    const response = await request(app)
      .post('/api/conversation')
      .set('Authorization', `Bearer ${jsonWebToken}`)
      .send({ conversation: testConversation });

    expect(response.status).toBe(201);
    expect(response.body?.error).toBeNull();
    expect(response.body?.data).not.toBeNull();
    expect(response.body?.data).toStrictEqual({
      name: testConversation.name,
      id: expect.any(Number),
    });

    testConversationId = response.body?.data?.id;
    const conversation = await Conversation.findById(testConversationId);
    expect(conversation).not.toBeNull();
  });

  it('should return 401 when requesting without a JSON web token', async () => {
    const response = await request(app)
      .post('/api/conversation')
      .send({ conversation: testConversation });
    expect(response.status).toBe(401);
    expect(response.body?.data).toBeUndefined();
  });

  it('should return 400 if a required field is missing', async () => {
    const response = await request(app)
      .post('/api/conversation')
      .set('Authorization', `Bearer ${jsonWebToken}`)
      .send({ conversation: {} });

    expect(response.status).toBe(400);
    expect(response.body?.error).not.toBeNull();
    expect(response.body?.data).toBeNull();
  });
});

describe('GET /api/conversation/:conversationId', () => {
  let conversationId: number;
  const conversation = {
    // TO DO
  };

  beforeAll(async () => {
    // TO DO
  });

  afterAll(async () => {
    // TO DO
  });

  it('should return info on an existing conversation', async () => {
    // TO DO
  });
});
