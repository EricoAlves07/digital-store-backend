const bcrypt = require('bcrypt');
const {
  sequelize,
  User,
  Category,
  Product,
  ProductImage,
  ProductOption,
  ProductCategory,
} = require('../src/models');

describe('Etapa 2 — Banco de Dados, Models e Relacionamentos', () => {
  beforeAll(async () => {
    await ProductCategory.destroy({ where: {} });
    await ProductImage.destroy({ where: {} });
    await ProductOption.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });
    await User.destroy({ where: {} });
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

  it('deve ter criado todas as 6 tabelas no MySQL via migrations', async () => {
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((t) =>
      typeof t === 'string' ? t : Object.values(t)[0]
    );

    expect(tableNames).toEqual(
      expect.arrayContaining([
        'users',
        'categories',
        'products',
        'product_images',
        'product_options',
        'product_categories',
      ])
    );
  });

  it('deve criar User com hash bcrypt, ocultar password no toJSON e garantir email único', async () => {
    const user = await User.create({
      firstname: 'João',
      surname: 'Silva',
      email: 'joao.silva@example.com',
      password: ' PlainPassword123! ',
    });

    expect(user.id).toBeDefined();
    expect(user.password).not.toBe(' PlainPassword123! ');
    const isMatch = await bcrypt.compare(' PlainPassword123! ', user.password);
    expect(isMatch).toBe(true);
    expect(user.toJSON()).not.toHaveProperty('password');

    await expect(
      User.create({
        firstname: 'Outro',
        surname: 'Usuario',
        email: 'joao.silva@example.com',
        password: '123',
      })
    ).rejects.toThrow();
  });

  it('deve criar Category, Product, ProductImage, ProductOption e validar relacionamentos N:N e 1:N', async () => {
    const catShoes = await Category.create({
      name: 'Shoes',
      slug: 'shoes',
    });
    expect(catShoes.use_in_menu).toBe(false);

    const product = await Product.create({
      name: 'Tênis Nike Air',
      slug: 'tenis-nike-air',
      price: 299.9,
      price_with_discount: 249.9,
      description: 'Tênis esportivo confortável',
    });

    expect(product.enabled).toBe(false);
    expect(product.use_in_menu).toBe(false);
    expect(product.stock).toBe(0);

    await ProductImage.create({
      product_id: product.id,
      enabled: true,
      path: 'https://store.example.com/images/shoe1.png',
    });

    await ProductOption.create({
      product_id: product.id,
      title: 'Tamanho',
      values: '39,40,41,42',
    });

    await ProductCategory.create({
      product_id: product.id,
      category_id: catShoes.id,
    });

    const loadedProduct = await Product.findByPk(product.id, {
      include: [
        { model: ProductImage, as: 'images' },
        { model: ProductOption, as: 'options' },
        { model: Category, as: 'categories' },
      ],
    });

    expect(loadedProduct.images).toHaveLength(1);
    expect(loadedProduct.images[0].path).toBe(
      'https://store.example.com/images/shoe1.png'
    );

    expect(loadedProduct.options).toHaveLength(1);
    expect(loadedProduct.options[0].shape).toBe('square');
    expect(loadedProduct.options[0].radius).toBe(0);
    expect(loadedProduct.options[0].type).toBe('text');
    expect(loadedProduct.options[0].values).toBe('39,40,41,42');

    expect(loadedProduct.categories).toHaveLength(1);
    expect(loadedProduct.categories[0].slug).toBe('shoes');
  });
});
