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

describe('Etapa 6 — Auditoria Funcional, Segurança, Transações e Tratamento de Erros', () => {
  let token;
  let categoryId;

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
      firstname: 'Auditor',
      surname: 'Digital',
      email: 'auditor@example.com',
      password: '123@123',
      confirmPassword: '123@123',
    });

    const loginRes = await request(app).post('/v1/user/token').send({
      email: 'auditor@example.com',
      password: '123@123',
    });
    token = loginRes.body.token;

    const catRes = await request(app)
      .post('/v1/category')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Audit Category', slug: 'audit-category', use_in_menu: true });
    categoryId = catRes.body.id;
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

  it('deve retornar 400 quando o payload JSON for malformado', async () => {
    const response = await request(app)
      .post('/v1/user')
      .set('Content-Type', 'application/json')
      .send('{"firstname": "Invalido", ');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('deve exigir estritamente o esquema Authorization: Bearer <token> (retornar 401 sem Bearer)', async () => {
    const response = await request(app)
      .post('/v1/category')
      .set('Authorization', token)
      .send({ name: 'Teste Sem Bearer', slug: 'teste-sem-bearer' });

    expect(response.status).toBe(401);
  });

  it('deve fazer rollback completo da transação ao falhar na criação de opções inválidas em POST /v1/product', async () => {
    const countBefore = await Product.count();

    const response = await request(app)
      .post('/v1/product')
      .set('Authorization', `Bearer ${token}`)
      .send({
        enabled: true,
        name: 'Produto Rollback',
        slug: 'produto-rollback',
        price: 150,
        price_with_discount: 120,
        category_ids: [categoryId],
        options: [
          {
            title: 'Opção Inválida',
            shape: 'formato_inexistente',
            values: ['P', 'M'],
          },
        ],
      });

    expect(response.status).toBe(400);

    const countAfter = await Product.count();
    expect(countAfter).toBe(countBefore);
  });

  it('deve servir a imagem base64 salva através da rota estática /media/...', async () => {
    const createRes = await request(app)
      .post('/v1/product')
      .set('Authorization', `Bearer ${token}`)
      .send({
        enabled: true,
        name: 'Produto Com Imagem Servida',
        slug: 'produto-imagem-servida',
        price: 99.9,
        price_with_discount: 79.9,
        category_ids: [categoryId],
        images: [
          {
            type: 'image/png',
            content: sampleBase64Png,
          },
        ],
      });

    expect(createRes.status).toBe(201);
    const mediaUrl = createRes.body.images[0].content;
    expect(mediaUrl).toMatch(/^\/media\/product-.*\.png$/);

    const mediaRes = await request(app).get(mediaUrl);
    expect(mediaRes.status).toBe(200);
    expect(mediaRes.headers['content-type']).toMatch(/image\/png/);
  });

  it('deve tratar erros inesperados de banco de dados retornando 500 de forma controlada', async () => {
    const spy = jest
      .spyOn(Category, 'findByPk')
      .mockRejectedValueOnce(new Error('Falha simulada de conexão com o banco'));

    const response = await request(app).get(`/v1/category/${categoryId}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: 'Falha simulada de conexão com o banco',
    });

    spy.mockRestore();
  });
});
