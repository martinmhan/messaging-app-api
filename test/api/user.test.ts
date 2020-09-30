import request from 'supertest';
import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import app from '../../src/app';
import User from '../../src/models/User';
import Conversation from '../../src/models/Conversation';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database

describe('User API', () => {
  let existingUserId1: number;
  let existingUserId2: number;
  let userToCreateId: number;
  let userToUpdateId: number;
  let userToDeleteId: number;

  let existingUser1JsonWebToken: string;
  let existingUser2JsonWebToken: string;
  let userToUpdateJsonWebToken: string;
  let userToDeleteJsonWebToken: string;

  let conversationToGetId: number;
  const existingUser1 = {
    userName: `batman${uuid.v4()}`,
    password: 'alfred',
    firstName: 'Bruce',
    lastName: 'Wayne',
    email: `batman${uuid.v4()}@wayneenterprises.com`,
  };
  const existingUser2 = {
    userName: `wonderwoman${uuid.v4()}`,
    password: 'lassoOfTruth',
    firstName: 'Diana',
    lastName: 'Of Themyscira',
    email: `wonderwoman${uuid.v4()}@themyscira.com`,
  };
  const userToCreate = {
    userName: `superman${uuid.v4()}`,
    password: 'heatvision',
    firstName: 'Clark',
    lastName: 'Kent',
    email: `superman${uuid.v4()}@thedailyplanet.com`,
  };
  const userToCreateMissingLastName = {
    userName: `aquaman${uuid.v4()}`,
    password: 'ilovefish',
    firstName: 'Arthur',
    email: `aquaman${uuid.v4()}@atlantis.com`,
  };
  const userToUpdate = {
    userName: `flash${uuid.v4()}`,
    password: 'igofast',
    firstName: 'Barry',
    lastName: 'Allen',
    email: `theflash${uuid.v4()}@centralcity.com`,
  };
  const userToDelete = {
    userName: `martianmanhunter${uuid.v4()}`,
    password: 'mars',
    firstName: 'Jon',
    lastName: 'Jonnz',
    email: `mmh${uuid.v4()}@mars.com`,
  };

  const conversationToGet = {
    name: 'conversation to get',
  };

  beforeAll(async () => {
    const user1 = await User.create(existingUser1);
    const user2 = await User.create(existingUser2);
    const user3 = await User.create(userToUpdate);
    const user4 = await User.create(userToDelete);

    existingUserId1 = user1.getId();
    existingUserId2 = user2.getId();
    userToUpdateId = user3.getId();
    userToDeleteId = user4.getId();

    const existingUser1UserNamePassword = `${existingUser1.userName}:${existingUser1.password}`;
    const existingUser2UserNamePassword = `${existingUser2.userName}:${existingUser2.password}`;
    const userToUpdateUserNamePassword = `${userToUpdate.userName}:${userToUpdate.password}`;
    const userToDeleteUserNamePassword = `${userToDelete.userName}:${userToDelete.password}`;
    const existingUser1UserNamePasswordEncoded = Buffer.from(existingUser1UserNamePassword).toString('base64');
    const existingUser2UserNamePasswordEncoded = Buffer.from(existingUser2UserNamePassword).toString('base64');
    const userToUpdateUserNamePasswordEncoded = Buffer.from(userToUpdateUserNamePassword).toString('base64');
    const userToDeleteUserNamePasswordEncoded = Buffer.from(userToDeleteUserNamePassword).toString('base64');
    const existingUser1AuthorizationHeader = `Basic ${existingUser1UserNamePasswordEncoded}`;
    const existingUser2AuthorizationHeader = `Basic ${existingUser2UserNamePasswordEncoded}`;
    const userToUpdateAuthorizationHeader = `Basic ${userToUpdateUserNamePasswordEncoded}`;
    const userToDeleteAuthorizationHeader = `Basic ${userToDeleteUserNamePasswordEncoded}`;

    const [loginResponse1, loginResponse2, loginResponse3, loginResponse4] = await Promise.all([
      request(app)
        .post('/api/user/login')
        .set('Authorization', existingUser1AuthorizationHeader),
      request(app)
        .post('/api/user/login')
        .set('Authorization', existingUser2AuthorizationHeader),
      request(app)
        .post('/api/user/login')
        .set('Authorization', userToUpdateAuthorizationHeader),
      request(app)
        .post('/api/user/login')
        .set('Authorization', userToDeleteAuthorizationHeader),
    ]);

    existingUser1JsonWebToken = loginResponse1.body?.data?.jsonWebToken;
    existingUser2JsonWebToken = loginResponse2.body?.data?.jsonWebToken;
    userToUpdateJsonWebToken = loginResponse3.body?.data?.jsonWebToken;
    userToDeleteJsonWebToken = loginResponse4.body?.data?.jsonWebToken;

    const conversation = await Conversation.create(conversationToGet);
    conversationToGetId = conversation.getId();
    await conversation.addUser(existingUserId1);
  });

  afterAll(async () => {
    const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();
    await Promise.all([
      mySQLDatabaseAccess.deleteUser(existingUserId1),
      mySQLDatabaseAccess.deleteUser(existingUserId2),
      mySQLDatabaseAccess.deleteUser(userToCreateId),
      mySQLDatabaseAccess.deleteUser(userToUpdateId),
      mySQLDatabaseAccess.deleteUser(userToDeleteId),
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
      const response = await request(app)
        .post('/api/user')
        .send({ user: userToCreateMissingLastName });

      expect(response.status).toBe(400);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();

      const user = await User.findByUserName(userToCreateMissingLastName.userName);
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
      const response = await request(app)
        .post('/api/user')
        .send({ user: userToCreate });

      expect(response.status).toBe(201);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual({
        userName: userToCreate.userName,
        firstName: userToCreate.firstName,
        lastName: userToCreate.lastName,
        email: userToCreate.email,
        id: expect.any(Number),
      });

      userToCreateId = response.body?.data?.id;
      const createdUser = await User.findById(userToCreateId);
      expect(createdUser).toBeInstanceOf(User);
    });
  });

  describe('GET /api/user/:userId', () => {
    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app).get(`/api/user/${existingUserId1}`);
      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting with a JSON web token of a different user', async () => {
      const response = await request(app)
        .get(`/api/user/${existingUserId1}`)
        .set('Authorization', `Bearer ${existingUser2JsonWebToken}`);

      expect(response.status).toBe(403);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should return user information when requesting with a valid JSON web token', async () => {
      const response = await request(app)
        .get(`/api/user/${existingUserId1}`)
        .set('Authorization', `Bearer ${existingUser1JsonWebToken}`);

      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).not.toBeNull();
      expect(response.body?.data).toStrictEqual({
        userName: existingUser1.userName,
        firstName: existingUser1.firstName,
        lastName: existingUser1.lastName,
        email: existingUser1.email,
        id: existingUserId1,
      });
    });
  });

  describe('PATCH api/user', () => {
    const fieldsToUpdate = {
      email: `thefastestflash${uuid.v4()}@centralcity.com`,
    };

    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app)
        .patch(`/api/user/${userToUpdateId}`)
        .send({ fieldsToUpdate });

      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting with a JSON web token of a different user', async () => {
      const response = await request(app)
        .patch(`/api/user/${userToUpdateId}`)
        .set('Authorization', `Bearer ${existingUser1JsonWebToken}`)
        .send({ fieldsToUpdate });

      expect(response.status).toBe(403);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should return 400 when requesting without a fieldsToUpdate object in the request body', async () => {
      const response = await request(app)
        .patch(`/api/user/${userToUpdateId}`)
        .set('Authorization', `Bearer ${userToUpdateJsonWebToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body?.error).not.toBeNull();
      expect(response.body?.data).toBeNull();
    });

    it('should update user information', async () => {
      const response = await request(app)
        .patch(`/api/user/${userToUpdateId}`)
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
      const response = await request(app).delete(`/api/user/${userToDeleteId}`);

      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 403 when requesting with a JSON web token of a different user', async () => {
      const response = await request(app)
        .delete(`/api/user/${userToDeleteId}`)
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
        .delete(`/api/user/${userToDeleteId}`)
        .set('Authorization', `Bearer ${userToDeleteJsonWebToken}`);

      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();

      const deleteUser = await User.findByUserName(userToDelete.userName);
      expect(deleteUser).toBeNull();
    });
  });

  describe('GET api/user/:userId/conversations', () => {
    it('should return 401 when requesting without a JSON web token', async () => {
      const response = await request(app).get(`/api/user/${existingUserId1}/conversations`);

      expect(response.status).toBe(401);
      expect(response.body?.data).toBeUndefined();
    });

    it('should return 200 with the conversations the user is a member of', async () => {
      const response = await request(app)
        .get(`/api/user/${existingUserId1}/conversations`)
        .set('Authorization', `Bearer ${existingUser1JsonWebToken}`);

      expect(response.status).toBe(200);
      expect(response.body?.error).toBeNull();
      expect(response.body?.data).toStrictEqual([
        {
          name: 'conversation to get',
          id: conversationToGetId,
        },
      ]);
    });
  });
});
