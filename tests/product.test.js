const request = require('supertest');
const app = require('../src/app');
const {
  sequelize,
  User,
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory,
} = require('../src/models');

describe('Etapa 5 — Endpoints de Produtos (/v1/product)', () => {
  let token;
  let catShoesId;
  let catShirtsId;
  let createdProductId;
  let firstImageId;
  let firstOptionId;

  const sampleBase64Png =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeAll(async () => {
    await ProductCategory.destroy({ where: {} });
    await ProductImage.destroy({ where: {} });
    await ProductOption.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });

    await request(app).post('/v1/user').send({
      firstname: 'Admin',
      surname: 'Product',
      email: 'admin.product@example.com',
      password: '123@123',
      confirmPassword: '123@123',
    });

    const loginRes = await request(app).post('/v1/user/token').send({
      email: 'admin.product@example.com',
      password: '123@123',
    });

    token = loginRes.body.token;

    const cat1 = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Shoes', slug: 'shoes', use_in_menu: true });
    catShoesId = cat1.body.id;

    const cat2 = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Shirts', slug: 'shirts', use_in_menu: true });
    catShirtsId = cat2.body.id;
  });

  afterAll(async () => {
    await ProductCategory.destroy({ where: {} });
    await ProductImage.destroy({ where: {} });
    await ProductOption.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });
    await sequelize.close();
  });

  describe('POST /v1/product', () => {
    it('deve retornar 401 quando token ausente ou inválido', async () => {
      const noToken = await request(app).post('/v1/product').send({
        name: 'Produto Sem Token',
        slug: 'produto-sem-token',
        price: 100,
        price_with_discount: 90,
      });
      expect(noToken.status).toBe(401);

      const badToken = await request(app)
        .post('/v1/product')
        .set('Authorization', 'Bearer token.invalido')
        .send({
          name: 'Produto Token Ruim',
          slug: 'produto-token-ruim',
          price: 100,
          price_with_discount: 90,
        });
      expect(badToken.status).toBe(401);
    });

    it('deve cadastrar produto completo com categorias, imagens (base64 e URL) e opções (201)', async () => {
      const response = await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          enabled: true,
          name: 'Tênis K-Swiss V8',
          slug: 'tenis-k-swiss-v8',
          use_in_menu: true,
          stock: 15,
          description: 'Tênis casual de alta durabilidade',
          price: 200,
          price_with_discount: 149.9,
          category_ids: [catShoesId],
          images: [
            {
              type: 'image/png',
              content: sampleBase64Png,
            },
            {
              type: 'image/jpeg',
              content: 'https://store.example.com/media/shoe-2.jpg',
            },
          ],
          options: [
            {
              title: 'Tamanho',
              shape: 'square',
              radius: '4px',
              type: 'text',
              values: ['39', '40', '41'],
            },
            {
              title: 'Cor',
              shape: 'circle',
              type: 'color',
              values: ['#000000', '#FFFFFF'],
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Tênis K-Swiss V8');
      expect(response.body.category_ids).toEqual([catShoesId]);
      expect(response.body.images).toHaveLength(2);
      expect(response.body.images[0].content).toMatch(/^\/media\/product-.*\.png$/);
      expect(response.body.images[1].content).toBe(
        'https://store.example.com/media/shoe-2.jpg'
      );
      expect(response.body.options).toHaveLength(2);
      expect(response.body.options[0]).toMatchObject({
        title: 'Tamanho',
        shape: 'square',
        radius: 4,
        type: 'text',
        values: ['39', '40', '41'],
      });

      createdProductId = response.body.id;
      firstImageId = response.body.images[0].id;
      firstOptionId = response.body.options[0].id;
    });

    it('deve retornar 400 quando dados obrigatórios ou categorias forem inválidos', async () => {
      const invalidCategory = await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Produto Cat Inexistente',
          slug: 'prod-cat-inexistente',
          price: 100,
          price_with_discount: 80,
          category_ids: [999999],
        });
      expect(invalidCategory.status).toBe(400);

      const missingName = await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          slug: 'sem-nome',
          price: 100,
          price_with_discount: 80,
        });
      expect(missingName.status).toBe(400);
    });
  });

  describe('GET /v1/product/:id', () => {
    it('deve retornar 200 e o produto completo com categorias, imagens e opções', async () => {
      const response = await request(app).get(`/v1/product/${createdProductId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdProductId);
      expect(response.body.category_ids).toEqual([catShoesId]);
      expect(response.body.images).toHaveLength(2);
      expect(response.body.options).toHaveLength(2);
    });

    it('deve retornar 404 para produto inexistente', async () => {
      const response = await request(app).get('/v1/product/999999');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /v1/product/search', () => {
    beforeAll(async () => {
      await request(app)
        .post('/v1/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          enabled: true,
          name: 'Camisa Algodão Premium',
          slug: 'camisa-algodao-premium',
          use_in_menu: true,
          stock: 30,
          description: 'Camisa leve de verão',
          price: 89.9,
          price_with_discount: 69.9,
          category_ids: [catShirtsId],
          images: [{ content: 'https://store.example.com/media/shirt-1.jpg' }],
          options: [
            {
              title: 'Tamanho',
              shape: 'square',
              radius: 2,
              type: 'text',
              values: ['P', 'M', 'G'],
            },
          ],
        });
    });

    it('deve buscar produtos com paginação padrão', async () => {
      const response = await request(app).get('/v1/product/search');

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.limit).toBe(12);
      expect(response.body.page).toBe(1);
      expect(response.body.data).toHaveLength(2);
    });

    it('deve filtrar por match (nome ou descrição)', async () => {
      const response = await request(app).get('/v1/product/search?match=Algodão');

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.data[0].slug).toBe('camisa-algodao-premium');
    });

    it('deve filtrar por category_ids', async () => {
      const response = await request(app).get(
        `/v1/product/search?category_ids=${catShoesId}`
      );

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.data[0].id).toBe(createdProductId);
    });

    it('deve filtrar por price-range', async () => {
      const response = await request(app).get(
        '/v1/product/search?price-range=150-250'
      );

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.data[0].id).toBe(createdProductId);
    });

    it('deve filtrar por option[id]', async () => {
      const matchRes = await request(app).get(
        `/v1/product/search?option[${firstOptionId}]=40,42`
      );
      expect(matchRes.status).toBe(200);
      expect(matchRes.body.total).toBe(1);
      expect(matchRes.body.data[0].id).toBe(createdProductId);

      const noMatchRes = await request(app).get(
        `/v1/product/search?option[${firstOptionId}]=44`
      );
      expect(noMatchRes.status).toBe(200);
      expect(noMatchRes.body.total).toBe(0);
    });

    it('deve aplicar seleção de campos (fields) e limit=-1', async () => {
      const response = await request(app).get(
        '/v1/product/search?limit=-1&fields=name,price,images'
      );

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(-1);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('price');
      expect(response.body.data[0]).toHaveProperty('images');
      expect(response.body.data[0]).not.toHaveProperty('description');
    });
  });

  describe('PUT /v1/product/:id', () => {
    it('deve retornar 401 sem token JWT', async () => {
      const response = await request(app)
        .put(`/v1/product/${createdProductId}`)
        .send({ name: 'Sem Token' });

      expect(response.status).toBe(401);
    });

    it('deve retornar 404 para produto inexistente', async () => {
      const response = await request(app)
        .put('/v1/product/999999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Inexistente',
          slug: 'inexistente',
          price: 100,
          price_with_discount: 90,
        });

      expect(response.status).toBe(404);
    });

    it('deve atualizar dados do produto, categorias, remover/adicionar imagens e opções (204)', async () => {
      const response = await request(app)
        .put(`/v1/product/${createdProductId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          enabled: true,
          name: 'Tênis K-Swiss V8 Edição Especial',
          slug: 'tenis-k-swiss-v8-especial',
          stock: 25,
          price: 220,
          price_with_discount: 179.9,
          category_ids: [catShoesId, catShirtsId],
          images: [
            { id: firstImageId, deleted: true },
            { content: 'https://store.example.com/media/shoe-3-new.jpg' },
          ],
          options: [
            {
              id: firstOptionId,
              title: 'Numeração',
              radius: '8px',
              values: ['38', '39', '40', '41', '42'],
            },
          ],
        });

      expect(response.status).toBe(204);

      const updated = await request(app).get(`/v1/product/${createdProductId}`);
      expect(updated.status).toBe(200);
      expect(updated.body.name).toBe('Tênis K-Swiss V8 Edição Especial');
      expect(updated.body.stock).toBe(25);
      expect(updated.body.category_ids).toEqual(
        expect.arrayContaining([catShoesId, catShirtsId])
      );
      expect(updated.body.images).toHaveLength(2);
      expect(
        updated.body.images.some((img) => img.id === firstImageId)
      ).toBe(false);
      expect(
        updated.body.options.find((o) => o.id === firstOptionId)
      ).toMatchObject({
        title: 'Numeração',
        radius: 8,
        values: ['38', '39', '40', '41', '42'],
      });
    });
  });

  describe('DELETE /v1/product/:id', () => {
    it('deve retornar 401 sem token JWT', async () => {
      const response = await request(app).delete(
        `/v1/product/${createdProductId}`
      );
      expect(response.status).toBe(401);
    });

    it('deve retornar 404 para produto inexistente', async () => {
      const response = await request(app)
        .delete('/v1/product/999999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });

    it('deve excluir o produto e seus relacionamentos e retornar 204', async () => {
      const response = await request(app)
        .delete(`/v1/product/${createdProductId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);

      const getRes = await request(app).get(`/v1/product/${createdProductId}`);
      expect(getRes.status).toBe(404);

      const remainingImages = await ProductImage.count({
        where: { product_id: createdProductId },
      });
      const remainingOptions = await ProductOption.count({
        where: { product_id: createdProductId },
      });
      const remainingCats = await ProductCategory.count({
        where: { product_id: createdProductId },
      });

      expect(remainingImages).toBe(0);
      expect(remainingOptions).toBe(0);
      expect(remainingCats).toBe(0);
    });
  });
});
