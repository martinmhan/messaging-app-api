import dotenv from 'dotenv';
import * as uuid from 'uuid';

dotenv.config();

import User from '../../src/models/User';
import MySQLDatabaseAccess from '../../src/database/MySQLDatabaseAccess';

jest.mock('../../src/database/MySQLDatabaseAccess.ts'); // comment this line to use the real database

describe('User model', () => {
  // const userToCreate
  // const userToGet
  // const userToUpdate
  // const userToDelete

  beforeAll(async () => {
    // create user(s)
  });

  afterAll(async () => {
    // delete users
    const mySQLDatabaseAccess = MySQLDatabaseAccess.getInstance();
    await mySQLDatabaseAccess.disconnect();
  });

  it('should create a new user if appropriate fields are provided', async () => {
    // TO DO
  });

  it('should get an existing user by id', async () => {
    // TO DO
  });

  it('should get an existing user by userName', async () => {
    // TO DO
  });

  it('should return null when searching for a nonexistent userId', async () => {
    // TO DO
  });

  it('should return null when searching for a nonexistent userName', async () => {
    // TO DO
  });

  it('should update a user', async () => {
    // TO DO
  });

  it('should delete a user', async () => {
    // TO DO
  });

  it('should not be able to be instantiated using the `new` keyword', async () => {
    // TO DO
  });
});
