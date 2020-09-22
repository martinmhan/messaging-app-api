import request from 'supertest';
import dotenv from 'dotenv';

dotenv.config();

import app from '../src/app';
import mySQLDatabaseAccess from '../src/database/mySQLDatabaseAccess';

describe('GET /api/test', () => {
  afterAll(() => {
    mySQLDatabaseAccess.connection.end();
  });

  it('should return 200 OK', async () => {
    const response = await request(app).get('/api/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ someData: 'hello world' });
  });
});
