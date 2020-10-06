import request from 'supertest';
import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import app from '../../src/app';
import User from '../../src/models/User';
import Conversation from '../../src/models/Conversation';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';
import * as utils from '../utils';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database

describe('User API', () => {
  let existingUser1: utils.UserInfo;
  let existingUser2: utils.UserInfo;
  let userToUpdate: utils.UserInfo;
  let userToDelete: utils.UserInfo;

  let existingUser1JsonWebToken: string;
  let existingUser2JsonWebToken: string;
  let userToUpdateJsonWebToken: string;
  let userToDeleteJsonWebToken: string;

  let userToCreateId: number;

  let conversationToGet: Conversation;

  beforeAll(async () => {
    existingUser1 = await utils.createTestUser();
    existingUser2 = await utils.createTestUser();
    userToUpdate = await utils.createTestUser();
    userToDelete = await utils.createTestUser();

    existingUser1JsonWebToken = await utils.getJsonWebToken(app, existingUser1.userName, existingUser1.password);
    existingUser2JsonWebToken = await utils.getJsonWebToken(app, existingUser2.userName, existingUser2.password);
    userToUpdateJsonWebToken = await utils.getJsonWebToken(app, userToUpdate.userName, userToUpdate.password);
    userToDeleteJsonWebToken = await utils.getJsonWebToken(app, userToDelete.userName, userToDelete.password);

    conversationToGet = await utils.createTestConversation();
    await conversationToGet.addUser(existingUser1.id);
  });

  afterAll(async () => {
    const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();
    await Promise.all([
      mySQLDatabaseAccess.deleteUser(existingUser1.id),
      mySQLDatabaseAccess.deleteUser(existingUser2.id),
      mySQLDatabaseAccess.deleteUser(userToUpdate.id),
      mySQLDatabaseAccess.deleteUser(userToDelete.id),
      mySQLDatabaseAccess.deleteUser(userToCreateId),
    ]);
  });

  describe('POST /api/user/login', () => {
    it('should return 400 if no credentials are provided', async () => {
      const response = await request(app).post('/api/user/login');
      expect(response.status).toBe(400);
      expect(response.body?.error).not.toBeNull();
    });

    it('should return 400 if incorrect credentials are provided', async () => {
      const userNamePassword = `${existingUser1.userName}:Incorrect${existingUser1.password}`;
      const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
      const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

      const response = await request(app)
        .post('/api/user/login')
        .set('Authorization', authorizationHeader);
      expect(response.status).toBe(400);
      expect(response.body?.error).not.toBeNull();
    });

    it('should return a JSON web token when correct credentials are provided in the Authorization header', async () => {
      const userNamePassword = `${existingUser1.userName}:${existingUser1.password}`;
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
      const response = await request(app)
        .post('/api/user')
        .send({
          userName: existingUser1.userName,
          password: 'iwannabebatman',
          firstName: 'Batman',
          lastName: 'Wannabe',
          email: 'fakebatman@yahoo.com',
        });

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

      userToCreateId = response.body?.data?.id;
      const createdUser = await User.findById(userToCreateId);
      expect(createdUser).toBeInstanceOf(User);
    });
  });

  describe('GET /api/user/:userId', () => {
    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app).get(`/api/user/${existingUser1.id}`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting with a JSON web token of a different user', async () => {
      const response = await request(app)
        .get(`/api/user/${existingUser1.id}`)
        .set('Authorization', `Bearer ${existingUser2JsonWebToken}`);

      expect(response.status).toBe(403);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should return user information when requesting with a valid JSON web token', async () => {
      const response = await request(app)
        .get(`/api/user/${existingUser1.id}`)
        .set('Authorization', `Bearer ${existingUser1JsonWebToken}`);

      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).not.toBeNull();
      expect(response.body?.data).toStrictEqual({
        userName: existingUser1.userName,
        firstName: existingUser1.firstName,
        lastName: existingUser1.lastName,
        email: existingUser1.email,
        id: existingUser1.id,
      });
    });
  });

  describe('PATCH api/user', () => {
    const fieldsToUpdate = {
      email: `thefastestflash${uuid.v4()}@centralcity.com`,
    };

    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app)
        .patch(`/api/user/${userToUpdate.id}`)
        .send({ fieldsToUpdate });

      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting with a JSON web token of a different user', async () => {
      const response = await request(app)
        .patch(`/api/user/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${existingUser1JsonWebToken}`)
        .send({ fieldsToUpdate });

      expect(response.status).toBe(403);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting without a fieldsToUpdate object in the request body', async () => {
      const response = await request(app)
        .patch(`/api/user/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${userToUpdateJsonWebToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should update user information', async () => {
      const response = await request(app)
        .patch(`/api/user/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${userToUpdateJsonWebToken}`)
        .send({ fieldsToUpdate });

      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        userName: userToUpdate.userName,
        firstName: userToUpdate.firstName,
        lastName: userToUpdate.lastName,
        email: fieldsToUpdate.email,
        id: expect.any(Number),
      });

      const updatedUser = await User.findByUserName(userToUpdate.userName);
      expect(updatedUser.getEmail()).toBe(fieldsToUpdate.email);
    });
  });

  describe('DELETE api/user', () => {
    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app).delete(`/api/user/${userToDelete.id}`);

      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting with a JSON web token of a different user', async () => {
      const response = await request(app)
        .delete(`/api/user/${userToDelete.id}`)
        .set('Authorization', `Bearer ${existingUser1JsonWebToken}`);

      expect(response.status).toBe(403);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting with an invalid userId param', async () => {
      const response = await request(app)
        .delete(`/api/user/invalidUserId`)
        .set('Authorization', `Bearer ${userToDeleteJsonWebToken}`);

      expect(response.status).toBe(400);
    });

    it('should delete a user', async () => {
      const response = await request(app)
        .delete(`/api/user/${userToDelete.id}`)
        .set('Authorization', `Bearer ${userToDeleteJsonWebToken}`);

      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();

      const deleteUser = await User.findByUserName(userToDelete.userName);
      expect(deleteUser).toBeNull();
    });
  });

  describe('GET api/user/:userId/conversations', () => {
    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app).get(`/api/user/${existingUser1.id}/conversations`);

      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 200 with the conversations the user is a member of', async () => {
      const response = await request(app)
        .get(`/api/user/${existingUser1.id}/conversations`)
        .set('Authorization', `Bearer ${existingUser1JsonWebToken}`);

      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual([
        {
          name: conversationToGet.getName(),
          id: conversationToGet.getId(),
        },
      ]);
    });
  });
});
