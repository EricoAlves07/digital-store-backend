const request = require('supertest');
const app = require('../src/app');
const { User, Category, sequelize } = require('../src/models');

describe('Etapa 4 — Endpoints de Categorias (/v1/category)', () => {
  let token;
  let createdCategoryId;

  beforeAll(async () => {
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });

    await request(app).post('/v1/user').send({
      firstname: 'Admin',
      surname: 'Store',
      email: 'admin.cat@example.com',
      password: '123@123',
      confirmPassword: '123@123',
    });

    const loginRes = await request(app).post('/v1/user/token').send({
      email: 'admin.cat@example.com',
      password: '123@123',
    });

    token = loginRes.body.token;
  });

  afterAll(async () => {
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });
    await sequelize.close();
  });

  describe('POST /v1/category', () => {
    it('deve retornar 401 ao tentar criar categoria sem token JWT', async () => {
      const response = await request(app).post('/v1/category').send({
        name: 'Shoes',
        slug: 'shoes',
        use_in_menu: true,
      });

      expect(response.status).toBe(401);
    });

    it('deve criar uma categoria válida e retornar 201', async () => {
      const response = await request(app)
        .post('/v1/category')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Shoes',
          slug: 'shoes',
          use_in_menu: true,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toMatchObject({
        name: 'Shoes',
        slug: 'shoes',
        use_in_menu: true,
      });

      createdCategoryId = response.body.id;
    });

    it('deve retornar 400 para cadastro inválido (campos obrigatórios ausentes ou tipo inválido)', async () => {
      const missingName = await request(app)
        .post('/v1/category')
        .set('Authorization', `Bearer ${token}`)
        .send({
          slug: 'no-name',
        });
      expect(missingName.status).toBe(400);

      const invalidBool = await request(app)
        .post('/v1/category')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Invalid Bool',
          slug: 'invalid-bool',
          use_in_menu: 'sim',
        });
      expect(invalidBool.status).toBe(400);
    });
  });

  describe('GET /v1/category/:id', () => {
    it('deve retornar 200 e os dados da categoria existente', async () => {
      const response = await request(app).get(`/v1/category/${createdCategoryId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: createdCategoryId,
        name: 'Shoes',
        slug: 'shoes',
        use_in_menu: true,
      });
    });

    it('deve retornar 404 para categoria inexistente', async () => {
      const response = await request(app).get('/v1/category/999999');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /v1/category/search', () => {
    beforeAll(async () => {
      await Category.bulkCreate([
        { name: 'Shirts', slug: 'shirts', use_in_menu: true },
        { name: 'Pants', slug: 'pants', use_in_menu: false },
        { name: 'Accessories', slug: 'accessories', use_in_menu: true },
      ]);
    });

    it('deve retornar lista paginada padrão (limit 12, page 1) e total correto', async () => {
      const response = await request(app).get('/v1/category/search');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.total).toBe(4);
      expect(response.body.limit).toBe(12);
      expect(response.body.page).toBe(1);
      expect(response.body.data).toHaveLength(4);
    });

    it('deve aplicar paginação corretamente (limit=2, page=2)', async () => {
      const response = await request(app).get('/v1/category/search?limit=2&page=2');

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(4);
      expect(response.body.limit).toBe(2);
      expect(response.body.page).toBe(2);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].slug).toBe('pants');
      expect(response.body.data[1].slug).toBe('accessories');
    });

    it('deve retornar todos os registros quando limit=-1', async () => {
      const response = await request(app).get('/v1/category/search?limit=-1');

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(-1);
      expect(response.body.total).toBe(4);
      expect(response.body.data).toHaveLength(4);
    });

    it('deve filtrar por use_in_menu=true e use_in_menu=false', async () => {
      const menuTrue = await request(app).get('/v1/category/search?use_in_menu=true');
      expect(menuTrue.status).toBe(200);
      expect(menuTrue.body.total).toBe(3);
      expect(menuTrue.body.data.every((c) => c.use_in_menu === true)).toBe(true);

      const menuFalse = await request(app).get('/v1/category/search?use_in_menu=false');
      expect(menuFalse.status).toBe(200);
      expect(menuFalse.body.total).toBe(1);
      expect(menuFalse.body.data[0].slug).toBe('pants');
    });

    it('deve selecionar apenas os campos solicitados em fields (incluindo id)', async () => {
      const response = await request(app).get('/v1/category/search?fields=name,slug');

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('slug');
      expect(response.body.data[0]).not.toHaveProperty('use_in_menu');
    });

    it('deve retornar 400 para parâmetros de busca inválidos', async () => {
      const invalidLimit = await request(app).get('/v1/category/search?limit=0');
      expect(invalidLimit.status).toBe(400);

      const invalidPage = await request(app).get('/v1/category/search?page=0');
      expect(invalidPage.status).toBe(400);

      const invalidUseInMenu = await request(app).get('/v1/category/search?use_in_menu=talvez');
      expect(invalidUseInMenu.status).toBe(400);

      const invalidFields = await request(app).get('/v1/category/search?fields=campo_inexistente');
      expect(invalidFields.status).toBe(400);
    });
  });

  describe('PUT /v1/category/:id', () => {
    it('deve retornar 401 sem token JWT', async () => {
      const response = await request(app)
        .put(`/v1/category/${createdCategoryId}`)
        .send({ name: 'Shoes Edit', slug: 'shoes-edit', use_in_menu: false });

      expect(response.status).toBe(401);
    });

    it('deve retornar 404 para categoria inexistente', async () => {
      const response = await request(app)
        .put('/v1/category/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Shoes Edit', slug: 'shoes-edit', use_in_menu: false });

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para dados inválidos no PUT', async () => {
      const response = await request(app)
        .put(`/v1/category/${createdCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '', slug: '' });

      expect(response.status).toBe(400);
    });

    it('deve atualizar a categoria e retornar 204', async () => {
      const response = await request(app)
        .put(`/v1/category/${createdCategoryId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Sneakers',
          slug: 'sneakers',
          use_in_menu: false,
        });

      expect(response.status).toBe(204);

      const checkRes = await request(app).get(`/v1/category/${createdCategoryId}`);
      expect(checkRes.status).toBe(200);
      expect(checkRes.body).toEqual({
        id: createdCategoryId,
        name: 'Sneakers',
        slug: 'sneakers',
        use_in_menu: false,
      });
    });
  });

  describe('DELETE /v1/category/:id', () => {
    it('deve retornar 401 sem token JWT', async () => {
      const response = await request(app).delete(`/v1/category/${createdCategoryId}`);
      expect(response.status).toBe(401);
    });

    it('deve retornar 404 para categoria inexistente', async () => {
      const response = await request(app)
        .delete('/v1/category/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('deve excluir a categoria e retornar 204', async () => {
      const response = await request(app)
        .delete(`/v1/category/${createdCategoryId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);

      const checkAfterDelete = await request(app).get(`/v1/category/${createdCategoryId}`);
      expect(checkAfterDelete.status).toBe(404);
    });
  });
});
