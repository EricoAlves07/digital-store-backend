const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../src/app');

describe('Etapa 7 — Documentação da API (Swagger/OpenAPI e .env.example)', () => {
  it('GET /api-docs/ deve retornar 200 e carregar a interface do Swagger UI', async () => {
    const response = await request(app).get('/api-docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger-ui');
  });

  it('GET /api-docs.json deve retornar 200 e conter todos os endpoints oficiais e bearerAuth', async () => {
    const response = await request(app).get('/api-docs.json');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.components.securitySchemes).toHaveProperty('bearerAuth');

    const paths = Object.keys(response.body.paths);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/health',
        '/v1/user/token',
        '/v1/user',
        '/v1/user/{id}',
        '/v1/category/search',
        '/v1/category',
        '/v1/category/{id}',
        '/v1/product/search',
        '/v1/product',
        '/v1/product/{id}',
      ])
    );
  });

  it('.env.example deve documentar todas as variáveis sem expor segredos reais', () => {
    const envExamplePath = path.resolve(__dirname, '..', '.env.example');
    const content = fs.readFileSync(envExamplePath, 'utf8');

    expect(content).toContain('DB_HOST=');
    expect(content).toContain('DB_PORT=');
    expect(content).toContain('DB_NAME=');
    expect(content).toContain('DB_USER=');
    expect(content).toContain('DB_PASS=sua_senha_do_mysql_aqui');
    expect(content).toContain('JWT_SECRET=substitua_por_uma_chave_secreta_forte');
  });
});
