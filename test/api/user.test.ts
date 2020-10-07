import request from 'supertest';
import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import app from '../../src/app';
import User from '../../src/models/User';
import Conversation from '../../src/models/Conversation';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';
import * as utils from '../utils';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // Use this line to use a mock DB (NOTE - behavior may differ from real DB)

describe('User API', () => {
  let testUser1: utils.UserInfo;
  let testUser2: utils.UserInfo;
  let createdUserId: number;

  let testUser1JsonWebToken: string;
  let testUser2JsonWebToken: string;

  let testConversation: Conversation;

  beforeEach(async () => {
    testUser1 = await utils.createTestUser();
    testUser2 = await utils.createTestUser();
    testUser1JsonWebToken = await utils.getJsonWebToken(app, testUser1.userName, testUser1.password);
    testUser2JsonWebToken = await utils.getJsonWebToken(app, testUser2.userName, testUser2.password);
    testConversation = await utils.createTestConversation();
    testConversation.addUser(testUser1.id);
  });

  afterEach(async () => {
    const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();
    await mySQLDatabaseAccess.deleteUser(testUser1.id);
    await mySQLDatabaseAccess.deleteUser(testUser2.id);
    await mySQLDatabaseAccess.deleteConversation(testConversation.getId());
  });

  describe('POST /api/user/login', () => {
    it('should return 400 if no credentials are provided', async () => {
      const response = await request(app).post('/api/user/login');
      expect(response.status).toBe(400);
      expect(response.body?.error).not.toBeNull();
    });

    it('should return 400 if incorrect credentials are provided', async () => {
      const userNamePassword = `${testUser1.userName}:Incorrect${testUser1.password}`;
      const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
      const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

      const response = await request(app)
        .post('/api/user/login')
        .set('Authorization', authorizationHeader);
      expect(response.status).toBe(400);
      expect(response.body?.error).not.toBeNull();
    });

    it('should return a JSON web token when correct credentials are provided in the Authorization header', async () => {
      const userNamePassword = `${testUser1.userName}:${testUser1.password}`;
      const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
      const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

      const response = await request(app)
        .post('/api/user/login')
        .set('Authorization', authorizationHeader);

      expect(response.status).toBe(201);
      expect(response?.body?.error).toBeNull();
      expect(response?.body?.data).toHaveProperty('jsonWebToken');
      expect(typeof response?.body?.data?.jsonWebToken).toBe('string');
    });
  });

  describe('POST api/user', () => {
    it('should return 400 and not create a new user if a required field is missing', async () => {
      const userConfigMissingLastName = {
        userName: uuid.v4(),
        password: uuid.v4(),
        firstName: uuid.v4(),
        email: uuid.v4(),
      };

      const response = await request(app)
        .post('/api/user')
        .send({ user: userConfigMissingLastName });

      expect(response.status).toBe(400);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();

      const user = await User.findByUserName(userConfigMissingLastName.userName);
      expect(user).toBeNull();
    });

    it('should return 400 if requesting to create a user with an existing userName', async () => {
      const userConfig = {
        userName: testUser1.userName,
        password: uuid.v4(),
        firstName: uuid.v4(),
        lastName: uuid.v4(),
        email: uuid.v4(),
      };

      const response = await request(app)
        .post('/api/user')
        .send({ user: userConfig });

      expect(response.status).toBe(400);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should create a new user when the required fields are provided', async () => {
      const userConfig = {
        userName: uuid.v4(),
        password: uuid.v4(),
        firstName: uuid.v4(),
        lastName: uuid.v4(),
        email: uuid.v4(),
      };

      const response = await request(app)
        .post('/api/user')
        .send({ user: userConfig });

      expect(response.status).toBe(201);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        userName: userConfig.userName,
        firstName: userConfig.firstName,
        lastName: userConfig.lastName,
        email: userConfig.email,
        id: expect.any(Number),
      });

      createdUserId = response.body?.data?.id;
      const createdUser = await User.findById(createdUserId);
      expect(createdUser).toBeInstanceOf(User);
    });
  });

  describe('GET /api/user/:userId', () => {
    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app).get(`/api/user/${testUser1.id}`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting with a JSON web token of a different user', async () => {
      const response = await request(app)
        .get(`/api/user/${testUser1.id}`)
        .set('Authorization', `Bearer ${testUser2JsonWebToken}`);

      expect(response.status).toBe(403);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting with an invalid userId', async () => {
      const response = await request(app)
        .get('/api/user/notANumber')
        .set('Authorization', `Bearer ${testUser1JsonWebToken}`);

      expect(response.status).toBe(400);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should return user information when requesting with a valid JSON web token', async () => {
      const response = await request(app)
        .get(`/api/user/${testUser1.id}`)
        .set('Authorization', `Bearer ${testUser1JsonWebToken}`);

      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).not.toBeNull();
      expect(response.body?.data).toStrictEqual({
        userName: testUser1.userName,
        firstName: testUser1.firstName,
        lastName: testUser1.lastName,
        email: testUser1.email,
        id: testUser1.id,
      });
    });
  });

  describe('PATCH api/user', () => {
    const fieldsToUpdate = {
      email: `thefastestflash${uuid.v4()}@centralcity.com`,
    };

    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app)
        .patch(`/api/user/${testUser1.id}`)
        .send({ fieldsToUpdate });

      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting with a JSON web token of a different user', async () => {
      const response = await request(app)
        .patch(`/api/user/${testUser1.id}`)
        .set('Authorization', `Bearer ${testUser2JsonWebToken}`)
        .send({ fieldsToUpdate });

      expect(response.status).toBe(403);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting without a fieldsToUpdate object in the request body', async () => {
      const response = await request(app)
        .patch(`/api/user/${testUser1.id}`)
        .set('Authorization', `Bearer ${testUser1JsonWebToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should update user information', async () => {
      const response = await request(app)
        .patch(`/api/user/${testUser1.id}`)
        .set('Authorization', `Bearer ${testUser1JsonWebToken}`)
        .send({ fieldsToUpdate });

      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        userName: testUser1.userName,
        firstName: testUser1.firstName,
        lastName: testUser1.lastName,
        email: fieldsToUpdate.email,
        id: expect.any(Number),
      });

      const updatedUser = await User.findByUserName(testUser1.userName);
      expect(updatedUser?.getEmail()).toBe(fieldsToUpdate.email);
    });
  });

  describe('PUT api/user/:userId/password', () => {
    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app).put(`/api/user/${testUser1.id}/password`);

      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting with a JSON web token of a different user', async () => {
      const response = await request(app)
        .put(`/api/user/${testUser1.id}/password`)
        .set('Authorization', `Bearer ${testUser2JsonWebToken}`);

      expect(response.status).toBe(403);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting without a newPassword', async () => {
      const response = await request(app)
        .put(`/api/user/${testUser1.id}/password`)
        .set('Authorization', `Bearer ${testUser1JsonWebToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 200 and update a user password', async () => {
      const newPassword = uuid.v4();
      const response = await request(app)
        .put(`/api/user/${testUser1.id}/password`)
        .set('Authorization', `Bearer ${testUser1JsonWebToken}`)
        .send({ newPassword });

      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).not.toBeNull();

      const user = await User.findById(testUser1.id);
      expect(user?.validatePassword(newPassword)).toBe(true);
    });
  });

  describe('DELETE api/user', () => {
    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app).delete(`/api/user/${testUser1.id}`);

      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting with a JSON web token of a different user', async () => {
      const response = await request(app)
        .delete(`/api/user/${testUser1.id}`)
        .set('Authorization', `Bearer ${testUser2JsonWebToken}`);

      expect(response.status).toBe(403);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting with an invalid userId param', async () => {
      const response = await request(app)
        .delete(`/api/user/invalidUserId`)
        .set('Authorization', `Bearer ${testUser1JsonWebToken}`);

      expect(response.status).toBe(400);
    });

    it('should delete a user', async () => {
      const response = await request(app)
        .delete(`/api/user/${testUser1.id}`)
        .set('Authorization', `Bearer ${testUser1JsonWebToken}`);

      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();

      const deleteUser = await User.findById(testUser1.id);
      expect(deleteUser).toBeNull();
    });
  });

  describe('GET api/user/:userId/conversations', () => {
    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app).get(`/api/user/${testUser1.id}/conversations`);

      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting conversations of a different user', async () => {
      const response = await request(app)
        .get(`/api/user/${testUser1.id}/conversations`)
        .set('Authorization', `Bearer ${testUser2JsonWebToken}`);

      expect(response.status).toBe(403);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should return 200 with the conversations the user is a member of', async () => {
      const response = await request(app)
        .get(`/api/user/${testUser1.id}/conversations`)
        .set('Authorization', `Bearer ${testUser1JsonWebToken}`);

      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual([
        {
          name: testConversation.getName(),
          id: testConversation.getId(),
        },
      ]);
    });
  });
});
