const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const { User, sequelize } = require('../src/models');

describe('Etapa 3 — Endpoints de Usuários e Autenticação (/v1/user)', () => {
  let createdUserId;
  let validToken;

  beforeAll(async () => {
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await User.destroy({ where: {} });
    await sequelize.close();
  });

  describe('POST /v1/user (Cadastro)', () => {
    it('deve cadastrar um usuário válido com status 201, hash bcrypt no banco e sem expor senha', async () => {
      const response = await request(app).post('/v1/user').send({
        firstname: 'Eric',
        surname: 'Alves',
        email: 'eric@example.com',
        password: '123@123',
        confirmPassword: '123@123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.firstname).toBe('Eric');
      expect(response.body.surname).toBe('Alves');
      expect(response.body.email).toBe('eric@example.com');
      expect(response.body).not.toHaveProperty('password');

      createdUserId = response.body.id;

      const userInDb = await User.findByPk(createdUserId);
      expect(userInDb.password).not.toBe('123@123');
      const isBcryptHash = await bcrypt.compare('123@123', userInDb.password);
      expect(isBcryptHash).toBe(true);
    });

    it('deve retornar 400 para cadastro inválido (campos obrigatórios ausentes)', async () => {
      const response = await request(app).post('/v1/user').send({
        firstname: 'Eric',
        email: 'incompleto@example.com',
      });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para formato de email inválido', async () => {
      const response = await request(app).post('/v1/user').send({
        firstname: 'Eric',
        surname: 'Alves',
        email: 'email-invalido',
        password: '123@123',
        confirmPassword: '123@123',
      });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 quando confirmPassword não confere com password', async () => {
      const response = await request(app).post('/v1/user').send({
        firstname: 'Eric',
        surname: 'Alves',
        email: 'outro@example.com',
        password: '123@123',
        confirmPassword: 'diferente',
      });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para email duplicado', async () => {
      const response = await request(app).post('/v1/user').send({
        firstname: 'Eric',
        surname: 'Duplicado',
        email: 'eric@example.com',
        password: '123@123',
        confirmPassword: '123@123',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /v1/user/token (Login JWT)', () => {
    it('deve retornar 200 e um token JWT para login correto', async () => {
      const response = await request(app).post('/v1/user/token').send({
        email: 'eric@example.com',
        password: '123@123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      validToken = response.body.token;
    });

    it('deve retornar 400 para login incorreto (senha errada)', async () => {
      const response = await request(app).post('/v1/user/token').send({
        email: 'eric@example.com',
        password: 'senha_errada',
      });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para login incorreto (email inexistente)', async () => {
      const response = await request(app).post('/v1/user/token').send({
        email: 'naoexiste@example.com',
        password: '123@123',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /v1/user/:id', () => {
    it('deve retornar 200 e os dados do usuário existente sem expor senha', async () => {
      const response = await request(app).get(`/v1/user/${createdUserId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: createdUserId,
        firstname: 'Eric',
        surname: 'Alves',
        email: 'eric@example.com',
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const response = await request(app).get('/v1/user/999999');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /v1/user/:id (Protegido por JWT)', () => {
    it('deve retornar 401 quando não enviar token', async () => {
      const response = await request(app)
        .put(`/v1/user/${createdUserId}`)
        .send({
          firstname: 'Eric Editado',
          surname: 'Alves',
          email: 'eric@example.com',
        });

      expect(response.status).toBe(401);
    });

    it('deve retornar 401 quando enviar token inválido', async () => {
      const response = await request(app)
        .put(`/v1/user/${createdUserId}`)
        .set('Authorization', 'Bearer token.invalido.aqui')
        .send({
          firstname: 'Eric Editado',
          surname: 'Alves',
          email: 'eric@example.com',
        });

      expect(response.status).toBe(401);
    });

    it('deve retornar 404 ao tentar atualizar usuário inexistente', async () => {
      const response = await request(app)
        .put('/v1/user/999999')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          firstname: 'Eric',
          surname: 'Alves',
          email: 'eric@example.com',
        });

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 ao enviar dados inválidos no PUT', async () => {
      const response = await request(app)
        .put(`/v1/user/${createdUserId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          firstname: '',
          surname: 'Alves',
          email: 'email_invalido',
        });

      expect(response.status).toBe(400);
    });

    it('deve impedir que um usuário autenticado altere dados de outro usuário (403)', async () => {
      const secondUserRes = await request(app).post('/v1/user').send({
        firstname: 'Maria',
        surname: 'Souza',
        email: 'maria@example.com',
        password: '123@123',
        confirmPassword: '123@123',
      });
      const secondUserId = secondUserRes.body.id;

      const response = await request(app)
        .put(`/v1/user/${secondUserId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          firstname: 'Tentativa Invasao',
          surname: 'Souza',
          email: 'maria@example.com',
        });

      expect(response.status).toBe(403);
    });

    it('deve atualizar firstname, surname e email com sucesso e retornar 204', async () => {
      const response = await request(app)
        .put(`/v1/user/${createdUserId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          firstname: 'Eric Atualizado',
          surname: 'Alves Silva',
          email: 'eric.novo@example.com',
        });

      expect(response.status).toBe(204);

      const checkRes = await request(app).get(`/v1/user/${createdUserId}`);
      expect(checkRes.status).toBe(200);
      expect(checkRes.body).toEqual({
        id: createdUserId,
        firstname: 'Eric Atualizado',
        surname: 'Alves Silva',
        email: 'eric.novo@example.com',
      });
    });
  });

  describe('DELETE /v1/user/:id (Protegido por JWT)', () => {
    it('deve retornar 401 ao tentar deletar sem token', async () => {
      const response = await request(app).delete(`/v1/user/${createdUserId}`);
      expect(response.status).toBe(401);
    });

    it('deve retornar 404 ao tentar deletar usuário inexistente', async () => {
      const response = await request(app)
        .delete('/v1/user/999999')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(404);
    });

    it('deve deletar o usuário autenticado e retornar 204', async () => {
      const response = await request(app)
        .delete(`/v1/user/${createdUserId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(204);

      const getAfterDelete = await request(app).get(`/v1/user/${createdUserId}`);
      expect(getAfterDelete.status).toBe(404);
    });
  });
});
