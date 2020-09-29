import request from 'supertest';
import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import app from '../../src/app';
import User from '../../src/models/User';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database

describe('POST /api/user/login', () => {
  let testUserId: number;
  const testUser = {
    userName: `batman${uuid.v4()}`,
    password: 'alfred',
    firstName: 'Bruce',
    lastName: 'Wayne',
    email: 'batman@wayneenterprises.com',
  };

  beforeAll(async () => {
    const newUser = await User.create(testUser);
    testUserId = newUser.getId();
  });

  afterAll(async () => {
    const user = await User.findById(testUserId);
    await user.delete();
    await MySQLDatabaseAccess.disconnect();
  });

  it('should return a JSON web token when correct credentials are provided in the Authorization header', async () => {
    const userNamePassword = `${testUser.userName}:${testUser.password}`;
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

  it('should return 400 if incorrect credentials are provided', async () => {
    const userNamePassword = `${testUser.userName}:Incorrect${testUser.password}`;
    const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
    const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

    const response = await request(app)
      .post('/api/user/login')
      .set('Authorization', authorizationHeader);
    expect(response.status).toBe(400);
    expect(response.body?.error).not.toBeNull();
  });

  it('should return 400 if no credentials are provided', async () => {
    const response = await request(app).post('/api/user/login');
    expect(response.status).toBe(400);
    expect(response.body?.error).not.toBeNull();
  });
});

describe('POST api/user', () => {
  const existingUser = {
    userName: `wonderwoman${uuid.v4()}`,
    password: 'lassoOfTruth',
    firstName: 'Diana',
    lastName: 'Of Themyscira',
    email: 'wonderwoman@themyscira.com',
  };

  const newUser = {
    userName: `superman${uuid.v4()}`,
    password: 'heatvision',
    firstName: 'Clark',
    lastName: 'Kent',
    email: 'superman@thedailyplanet.com',
  };

  const newUserMissingLastName = {
    userName: `aquaman${uuid.v4()}`,
    password: 'ilovefish',
    firstName: 'Arthur',
    email: 'aquaman@atlantis.com',
  };

  beforeAll(async () => {
    await User.create(existingUser);
  });

  afterAll(async () => {
    const existingUserInstance = await User.findByUserName(existingUser.userName);
    const newUserInstance = await User.findByUserName(newUser.userName);
    await existingUserInstance.delete();
    await newUserInstance.delete();
  });

  it('should create a new user when the required fields are provided', async () => {
    const response = await request(app)
      .post('/api/user')
      .send({ user: newUser });

    expect(response.status).toBe(201);
    expect(response.body?.error).toBeNull();
    expect(response.body?.data).toStrictEqual({
      userName: newUser.userName,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      id: expect.any(Number),
    });

    const createdUser = await User.findById(response.body?.data?.id);
    expect(createdUser).toBeInstanceOf(User);
  });

  it('should return 400 if attempting to create a user with an existing userName', async () => {
    const response = await request(app)
      .post('/api/user')
      .send({
        userName: existingUser.userName,
        password: 'iwannabewonderwoman',
        firstName: 'Diana',
        lastName: 'Wannabe',
        email: 'wonderwomanfake@yahoo.com',
      });

    expect(response.status).toBe(400);
    expect(response.body?.error).not.toBeNull();
    expect(response.body?.data).toBeNull();
  });

  it('should return 400 and not create a new user if a required field is missing', async () => {
    const response = await request(app)
      .post('/api/user')
      .send({ user: newUserMissingLastName });

    expect(response.status).toBe(400);
    expect(response.body?.error).not.toBeNull();
    expect(response.body?.data).toBeNull();
    expect(response.body?.data?.id).not.toBeDefined();

    const user = await User.findByUserName(newUserMissingLastName.userName);
    expect(user).toBeNull();
  });
});

describe('GET api/user/:userId', () => {
  let userId1: number;
  const user1 = {
    userName: `greenlantern${uuid.v4()}`,
    password: 'gogreen',
    firstName: 'Hal',
    lastName: 'Jordan',
    email: 'greenlantern@coastcity.com',
  };
  const user2 = {
    userName: `cyborg${uuid.v4()}`,
    password: 'teamrobots',
    firstName: 'Victor',
    lastName: 'Stone',
    email: 'cyborg@detroit.com',
  };

  beforeAll(async () => {
    const createdUser1 = await User.create(user1);
    const createdUser2 = await User.create(user2);
    userId1 = createdUser1.getId();
  });

  afterAll(async () => {
    const user1Instance = await User.findByUserName(user1.userName);
    const user2Instance = await User.findByUserName(user2.userName);
    await user1Instance.delete();
    await user2Instance.delete();
  });

  it('should return 401 when requesting without a JSON web token', async () => {
    const response = await request(app).get(`/api/user/${userId1}`);
    expect(response.status).toBe(401);
    expect(response.body?.data).toBeUndefined();
  });

  it('should return 403 when requesting with a JSON web token of a different user', async () => {
    const userNamePassword = `${user2.userName}:${user2.password}`;
    const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
    const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

    const loginResponse = await request(app)
      .post('/api/user/login')
      .set('Authorization', authorizationHeader);
    const { jsonWebToken } = loginResponse?.body?.data;

    const response = await request(app)
      .get(`/api/user/${userId1}`)
      .set('Authorization', `Bearer ${jsonWebToken}`);

    expect(response.status).toBe(403);
    expect(response.body?.error).not.toBeNull();
    expect(response.body?.data).toBeNull();
  });

  it('should return user information when requesting with a valid JSON web token', async () => {
    const userNamePassword = `${user1.userName}:${user1.password}`;
    const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
    const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

    const loginResponse = await request(app)
      .post('/api/user/login')
      .set('Authorization', authorizationHeader);
    const { jsonWebToken } = loginResponse?.body?.data;

    const response = await request(app)
      .get(`/api/user/${userId1}`)
      .set('Authorization', `Bearer ${jsonWebToken}`);

    expect(response.status).toBe(200);
    expect(response.body?.error).toBeNull();
    expect(response.body?.data).not.toBeNull();
    expect(response.body?.data).toStrictEqual({
      userName: user1.userName,
      firstName: user1.firstName,
      lastName: user1.lastName,
      email: user1.email,
      id: userId1,
    });
  });
});

describe('PATCH api/user', () => {
  let userId1: number;
  const user1 = {
    userName: `flash${uuid.v4()}`,
    password: 'igofast',
    firstName: 'Barry',
    lastName: 'Allen',
    email: 'theflash@centralcity.com',
  };

  const user2 = {
    userName: `flash${uuid.v4()}`,
    password: 'thespeedforce',
    firstName: 'Wally',
    lastName: 'West',
    email: 'theflash2@centralcity.com',
  };

  const fieldsToUpdate = {
    email: 'thefastestflash@centralcity.com',
  };

  beforeAll(async () => {
    const createdUser1 = await User.create(user1);
    const createdUser2 = await User.create(user2);
    userId1 = createdUser1.getId();
  });

  afterAll(async () => {
    const userInstance1 = await User.findByUserName(user1.userName);
    const userInstance2 = await User.findByUserName(user2.userName);
    await userInstance1.delete();
    await userInstance2.delete();
  });

  it('should return 401 when requesting without a JSON web token', async () => {
    const response = await request(app)
      .patch(`/api/user/${userId1}`)
      .send({ fieldsToUpdate });

    expect(response.status).toBe(401);
    expect(response.body?.data).toBeUndefined();
  });

  it('should return 403 when requesting with a JSON web token of a different user', async () => {
    const userNamePassword = `${user2.userName}:${user2.password}`;
    const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
    const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

    const loginResponse = await request(app)
      .post('/api/user/login')
      .set('Authorization', authorizationHeader);
    const { jsonWebToken } = loginResponse?.body?.data;

    const response = await request(app)
      .patch(`/api/user/${userId1}`)
      .set('Authorization', `Bearer ${jsonWebToken}`)
      .send({ fieldsToUpdate });

    expect(response.status).toBe(403);
    expect(response.body?.error).not.toBeNull();
    expect(response.body?.data).toBeNull();
  });

  it('should return 400 when requesting without a fieldsToUpdate object in the request body', async () => {
    const userNamePassword = `${user1.userName}:${user1.password}`;
    const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
    const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

    const loginResponse = await request(app)
      .post('/api/user/login')
      .set('Authorization', authorizationHeader);
    const { jsonWebToken } = loginResponse?.body?.data;

    const response = await request(app)
      .patch(`/api/user/${userId1}`)
      .set('Authorization', `Bearer ${jsonWebToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body?.error).not.toBeNull();
    expect(response.body?.data).toBeNull();
  });

  it('should update user information', async () => {
    const userNamePassword = `${user1.userName}:${user1.password}`;
    const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
    const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

    const loginResponse = await request(app)
      .post('/api/user/login')
      .set('Authorization', authorizationHeader);
    const { jsonWebToken } = loginResponse?.body?.data;

    const response = await request(app)
      .patch(`/api/user/${userId1}`)
      .set('Authorization', `Bearer ${jsonWebToken}`)
      .send({ fieldsToUpdate });

    expect(response.status).toBe(200);
    expect(response.body?.error).toBeNull();
    expect(response.body?.data).toStrictEqual({
      userName: user1.userName,
      firstName: user1.firstName,
      lastName: user1.lastName,
      email: fieldsToUpdate.email,
      id: expect.any(Number),
    });

    const updatedUser = await User.findByUserName(user1.userName);
    expect(updatedUser.getEmail()).toBe(fieldsToUpdate.email);
  });
});

describe('DELETE api/user', () => {
  let userId1: number;
  const user1 = {
    userName: `martianmanhunter${uuid.v4()}`,
    password: 'mars',
    firstName: 'Jon',
    lastName: 'Jonnz',
    email: 'mmh@mars.com',
  };

  const user2 = {
    userName: `hawkgirl${uuid.v4()}`,
    password: 'birds',
    firstName: 'Shiera',
    lastName: 'Hall',
    email: 'hawkgirl@atlanta.com',
  };

  beforeAll(async () => {
    const createdUser1 = await User.create(user1);
    const createdUser2 = await User.create(user2);
    userId1 = createdUser1.getId();
  });

  afterAll(async () => {
    const userInstance1 = await User.findByUserName(user1.userName);
    const userInstance2 = await User.findByUserName(user2.userName);
    await userInstance1.delete();
    await userInstance2.delete();
  });

  it('should return 401 when requesting without a JSON web token', async () => {
    const response = await request(app).delete(`/api/user/${userId1}`);

    expect(response.status).toBe(401);
    expect(response.body?.data).toBeUndefined();
  });

  it('should return 403 when requesting with a JSON web token of a different user', async () => {
    const userNamePassword = `${user2.userName}:${user2.password}`;
    const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
    const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

    const loginResponse = await request(app)
      .post('/api/user/login')
      .set('Authorization', authorizationHeader);
    const { jsonWebToken } = loginResponse?.body?.data;

    const response = await request(app)
      .delete(`/api/user/${userId1}`)
      .set('Authorization', `Bearer ${jsonWebToken}`);

    expect(response.status).toBe(403);
    expect(response.body?.error).not.toBeNull();
    expect(response.body?.data).toBeNull();
  });

  it('should return 400 when requesting with an invalid userId param', async () => {
    const userNamePassword = `${user1.userName}:${user1.password}`;
    const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
    const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

    const loginResponse = await request(app)
      .post('/api/user/login')
      .set('Authorization', authorizationHeader);
    const { jsonWebToken } = loginResponse?.body?.data;

    const response = await request(app)
      .delete(`/api/user/invalidUserId`)
      .set('Authorization', `Bearer ${jsonWebToken}`);

    expect(response.status).toBe(400);
  });

  it('should delete a user', async () => {
    const userNamePassword = `${user1.userName}:${user1.password}`;
    const userNamePasswordEncoded = Buffer.from(userNamePassword).toString('base64');
    const authorizationHeader = `Basic ${userNamePasswordEncoded}`;

    const loginResponse = await request(app)
      .post('/api/user/login')
      .set('Authorization', authorizationHeader);
    const { jsonWebToken } = loginResponse?.body?.data;

    const response = await request(app)
      .delete(`/api/user/${userId1}`)
      .set('Authorization', `Bearer ${jsonWebToken}`);

    expect(response.status).toBe(200);
    expect(response.body?.error).toBeNull();

    const deleteUser = await User.findByUserName(user1.userName);
    expect(deleteUser).toBeNull();
  });
});

describe('GET api/user/:userId/conversations', () => {
  // TO DO
});
