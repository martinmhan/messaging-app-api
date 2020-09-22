import request from 'supertest';

import app from '../src/app';

describe('GET /api/test', () => {
  it('should return 200 OK', async () => {
    const response = await request(app).get('/api/test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ someData: 'hello world' });
  });
});
