const request = require('supertest');
const app = require('../src/app');

describe('Health Check Endpoint', () => {
  it('GET /health deve retornar status 200 e status ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});
