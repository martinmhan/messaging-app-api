import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import User from '../../src/models/User';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database

describe('User model', () => {
  const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();

  let userToCreateId: number;
  let userToGetId: number;
  let userToUpdateId: number;
  let userToDeleteId: number;

  const userToCreate = {
    userName: uuid.v4(),
    password: uuid.v4(),
    firstName: uuid.v4(),
    lastName: uuid.v4(),
    email: uuid.v4(),
  };
  const userToGet = {
    userName: uuid.v4(),
    password: uuid.v4(),
    firstName: uuid.v4(),
    lastName: uuid.v4(),
    email: uuid.v4(),
  };
  const userToUpdate = {
    userName: uuid.v4(),
    password: uuid.v4(),
    firstName: uuid.v4(),
    lastName: uuid.v4(),
    email: uuid.v4(),
  };
  const userToDelete = {
    userName: uuid.v4(),
    password: uuid.v4(),
    firstName: uuid.v4(),
    lastName: uuid.v4(),
    email: uuid.v4(),
  };

  beforeAll(async () => {
    const user1 = await User.create(userToGet);
    const user2 = await User.create(userToUpdate);
    const user3 = await User.create(userToDelete);
    userToGetId = user1.getId();
    userToUpdateId = user2.getId();
    userToDeleteId = user3.getId();
  });

  afterAll(async () => {
    await Promise.all([
      mySQLDatabaseAccess.deleteUser(userToCreateId),
      mySQLDatabaseAccess.deleteUser(userToGetId),
      mySQLDatabaseAccess.deleteUser(userToUpdateId),
      mySQLDatabaseAccess.deleteUser(userToDeleteId),
    ]);
  });

  it('should create a new user', async () => {
    const user = await User.create(userToCreate);
    userToCreateId = user.getId();
    const userRow = await mySQLDatabaseAccess.getUserById(userToCreateId);
    expect(userRow).toEqual({
      id: expect.any(Number),
      userName: expect.any(String),
      firstName: expect.any(String),
      lastName: expect.any(String),
      email: expect.any(String),
      passwordHash: expect.any(String),
      passwordSalt: expect.any(String),
    });
  });

  it('should get an existing user by id', async () => {
    const user = await User.findById(userToGetId);
    expect(user).toBeInstanceOf(User);
    expect(user).toEqual({
      id: userToGetId,
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
    expect(user).toEqual({
      id: userToGetId,
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
    const user = await User.findById(userToUpdateId);
    const fieldsToUpdate = { firstName: uuid.v4() };
    await user.update(fieldsToUpdate);
    expect(user.getFirstName()).toEqual(fieldsToUpdate.firstName);
  });

  it('should delete an existing user', async () => {
    const userToDelete = await User.findById(userToDeleteId);
    await userToDelete.delete();
    const userRow = await mySQLDatabaseAccess.getUserById(userToDeleteId);
    expect(userRow).toBeUndefined();
  });
});
