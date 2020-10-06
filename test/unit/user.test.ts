import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import User from '../../src/models/User';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';
import * as utils from '../utils';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database

describe('User model', () => {
  const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();

  let userToCreateId: number;
  let userToGet: utils.UserInfo;
  let userToUpdate: utils.UserInfo;
  let userToDelete: utils.UserInfo;

  beforeAll(async () => {
    userToGet = await utils.createTestUser();
    userToUpdate = await utils.createTestUser();
    userToDelete = await utils.createTestUser();
  });

  afterAll(async () => {
    await Promise.all([
      mySQLDatabaseAccess.deleteUser(userToCreateId),
      mySQLDatabaseAccess.deleteUser(userToGet.id),
      mySQLDatabaseAccess.deleteUser(userToUpdate.id),
      mySQLDatabaseAccess.deleteUser(userToDelete.id),
    ]);
  });

  it('should create a new user', async () => {
    const userConfig = {
      userName: uuid.v4(),
      password: uuid.v4(),
      firstName: uuid.v4(),
      lastName: uuid.v4(),
      email: uuid.v4(),
    };

    const user = await User.create(userConfig);
    userToCreateId = user.getId();
    const userRow = await mySQLDatabaseAccess.getUserById(userToCreateId);
    expect(userRow).toEqual({
      id: expect.any(Number),
      userName: expect.any(String),
      firstName: expect.any(String),
      lastName: expect.any(String),
      email: expect.any(String),
      passwordHash: expect.any(Buffer),
      passwordSalt: expect.any(Buffer),
    });
  });

  it('should get an existing user by id', async () => {
    const user = await User.findById(userToGet.id);
    expect(user).toBeInstanceOf(User);
    expect(user).toMatchObject({
      id: userToGet.id,
      userName: userToGet.userName,
      firstName: userToGet.firstName,
      lastName: userToGet.lastName,
      email: userToGet.email,
      passwordHash: expect.any(String),
      passwordSalt: expect.any(String),
      conversations: null,
    });
  });

  it('should get an existing user by userName', async () => {
    const user = await User.findByUserName(userToGet.userName);
    expect(user).toBeInstanceOf(User);
    expect(user).toMatchObject({
      id: userToGet.id,
      userName: userToGet.userName,
      firstName: userToGet.firstName,
      lastName: userToGet.lastName,
      email: userToGet.email,
      passwordHash: expect.any(String),
      passwordSalt: expect.any(String),
      conversations: null,
    });
  });

  it('should return null when searching for a nonexistent userId', async () => {
    const user = await User.findById(0);
    expect(user).not.toBeInstanceOf(User);
    expect(user).toBeNull();
  });

  it('should return null when searching for a nonexistent userName', async () => {
    const user = await User.findByUserName(uuid.v4());
    expect(user).not.toBeInstanceOf(User);
    expect(user).toBeNull();
  });

  it('should update an existing user', async () => {
    const user = await User.findById(userToUpdate.id);
    const fieldsToUpdate = { firstName: uuid.v4() };
    await user?.update(fieldsToUpdate);
    expect(user?.getFirstName()).toEqual(fieldsToUpdate.firstName);
  });

  it('should delete an existing user', async () => {
    const user = await User.findById(userToDelete.id);
    await user?.delete();
    const userRow = await mySQLDatabaseAccess.getUserById(userToDelete.id);
    expect(userRow).toBeUndefined();
  });
});
