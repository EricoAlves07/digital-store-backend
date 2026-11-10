const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Op } = require('sequelize');
const {
  sequelize,
  Product,
  Category,
  ProductImage,
  ProductOption,
  ProductCategory,
} = require('../models');

const ALLOWED_PRODUCT_FIELDS = [
  'id',
  'enabled',
  'name',
  'slug',
  'use_in_menu',
  'stock',
  'description',
  'price',
  'price_with_discount',
  'category_ids',
  'images',
  'options',
];

const VALID_SHAPES = ['square', 'circle'];
const VALID_OPTION_TYPES = ['text', 'color'];

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parseRadius = (radius) => {
  if (radius === undefined || radius === null || radius === '') {
    return 0;
  }
  if (typeof radius === 'number' && Number.isInteger(radius) && radius >= 0) {
    return radius;
  }
  if (typeof radius === 'string') {
    const match = radius.trim().match(/^(\d+)(px)?$/i);
    if (match) {
      return Number(match[1]);
    }
  }
  throw createError(400, 'Valor de radius inválido na opção do produto.');
};

const normalizeOptionValuesToString = (optionItem) => {
  const rawValues =
    optionItem.values !== undefined ? optionItem.values : optionItem.value;

  if (Array.isArray(rawValues)) {
    const cleaned = rawValues
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0);
    if (cleaned.length === 0) {
      throw createError(400, 'Os valores (values) da opção são obrigatórios.');
    }
    return cleaned.join(',');
  }

  if (typeof rawValues === 'string' && rawValues.trim().length > 0) {
    const cleaned = rawValues
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    if (cleaned.length === 0) {
      throw createError(400, 'Os valores (values) da opção são obrigatórios.');
    }
    return cleaned.join(',');
  }

  throw createError(400, 'Os valores (values) da opção são obrigatórios.');
};

const processImagePath = (imageItem) => {
  if (!imageItem || typeof imageItem !== 'object') {
    throw createError(400, 'Dados de imagem inválidos.');
  }

  const rawContent = imageItem.content || imageItem.path;
  if (!rawContent || typeof rawContent !== 'string' || !rawContent.trim()) {
    throw createError(400, 'O conteúdo ou caminho da imagem é obrigatório.');
  }

  const trimmed = rawContent.trim();

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }

  const mimeType = imageItem.type || 'image/png';
  let ext = 'png';
  if (mimeType.includes('/')) {
    ext = mimeType.split('/')[1].replace(/[^a-z0-9]/gi, '') || 'png';
  }

  let base64Data = trimmed;
  const dataUriMatch = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (dataUriMatch) {
    ext = dataUriMatch[1] === 'jpeg' ? 'jpg' : dataUriMatch[1];
    base64Data = dataUriMatch[2];
  }

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `product-${crypto.randomUUID()}.${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

  return `/media/${fileName}`;
};

const formatProductOutput = (productInstance, requestedFields = null) => {
  const plain = productInstance.toJSON ? productInstance.toJSON() : productInstance;

  const categoryIds = Array.isArray(plain.productCategories)
    ? plain.productCategories.map((pc) => pc.category_id)
    : Array.isArray(plain.categories)
    ? plain.categories.map((c) => c.id)
    : [];

  const images = Array.isArray(plain.images)
    ? plain.images.map((img) => ({
        id: img.id,
        content: img.path,
      }))
    : [];

  const options = Array.isArray(plain.options)
    ? plain.options.map((opt) => ({
        id: opt.id,
        title: opt.title,
        shape: opt.shape,
        radius: opt.radius,
        type: opt.type,
        values: opt.values ? String(opt.values).split(',') : [],
      }))
    : [];

  const fullFormatted = {
    id: plain.id,
    enabled: Boolean(plain.enabled),
    name: plain.name,
    slug: plain.slug,
    use_in_menu: Boolean(plain.use_in_menu),
    stock: plain.stock,
    description: plain.description,
    price: plain.price,
    price_with_discount: plain.price_with_discount,
    category_ids: categoryIds,
    images,
    options,
  };

  if (!requestedFields) {
    return fullFormatted;
  }

  const filtered = { id: plain.id };
  requestedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(fullFormatted, field)) {
      filtered[field] = fullFormatted[field];
    }
  });
  return filtered;
};

class ProductService {
  static async search(query = {}) {
    let limit = 12;
    let page = 1;

    if (query.limit !== undefined && query.limit !== '') {
      const parsedLimit = Number(query.limit);
      if (
        !Number.isInteger(parsedLimit) ||
        (parsedLimit !== -1 && parsedLimit <= 0)
      ) {
        throw createError(400, 'Parâmetro limit inválido.');
      }
      limit = parsedLimit;
    }

    if (query.page !== undefined && query.page !== '') {
      const parsedPage = Number(query.page);
      if (!Number.isInteger(parsedPage) || parsedPage <= 0) {
        throw createError(400, 'Parâmetro page inválido.');
      }
      page = parsedPage;
    }

    let requestedFields = null;
    if (query.fields !== undefined && query.fields !== '') {
      const parsedFields = String(query.fields)
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      if (parsedFields.length === 0) {
        throw createError(400, 'Parâmetro fields inválido.');
      }

      const invalidField = parsedFields.find(
        (field) => !ALLOWED_PRODUCT_FIELDS.includes(field)
      );
      if (invalidField) {
        throw createError(400, `Campo inválido em fields: ${invalidField}`);
      }

      requestedFields = parsedFields;
    }

    const where = {};

    if (query.match !== undefined && String(query.match).trim() !== '') {
      const term = `%${String(query.match).trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: term } },
        { description: { [Op.like]: term } },
      ];
    }

    if (query['price-range'] !== undefined && query['price-range'] !== '') {
      const parts = String(query['price-range']).split('-');
      if (parts.length !== 2) {
        throw createError(400, 'Parâmetro price-range inválido. Use o formato min-max.');
      }
      const minPrice = Number(parts[0]);
      const maxPrice = Number(parts[1]);
      if (
        Number.isNaN(minPrice) ||
        Number.isNaN(maxPrice) ||
        minPrice < 0 ||
        maxPrice < minPrice
      ) {
        throw createError(400, 'Intervalo de preço inválido em price-range.');
      }
      where.price = { [Op.between]: [minPrice, maxPrice] };
    }

    let filteredProductIds = null;

    const intersectIds = (ids) => {
      if (filteredProductIds === null) {
        filteredProductIds = new Set(ids);
      } else {
        filteredProductIds = new Set(
          ids.filter((id) => filteredProductIds.has(id))
        );
      }
    };

    if (query.category_ids !== undefined && query.category_ids !== '') {
      const catIds = String(query.category_ids)
        .split(',')
        .map((v) => Number(v.trim()));

      if (
        catIds.length === 0 ||
        catIds.some((id) => !Number.isInteger(id) || id <= 0)
      ) {
        throw createError(400, 'Parâmetro category_ids inválido.');
      }

      const matches = await ProductCategory.findAll({
        where: { category_id: { [Op.in]: catIds } },
        attributes: ['product_id'],
      });

      intersectIds(matches.map((m) => m.product_id));
    }

    const optionFilters = [];
    if (query.option && typeof query.option === 'object') {
      Object.entries(query.option).forEach(([optId, optVals]) => {
        optionFilters.push([optId, optVals]);
      });
    }

    Object.entries(query).forEach(([key, val]) => {
      const matchKey = key.match(/^option\[(\d+)\]$/);
      if (matchKey) {
        optionFilters.push([matchKey[1], val]);
      }
    });

    for (const [rawOptId, rawOptValues] of optionFilters) {
      const optId = Number(rawOptId);
      if (!Number.isInteger(optId) || optId <= 0) {
        throw createError(400, 'Filtro de opção inválido.');
      }

      const desiredValues = String(rawOptValues)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      if (desiredValues.length === 0) {
        throw createError(400, 'Valores de filtro de opção inválidos.');
      }

      const optionRecord = await ProductOption.findByPk(optId);
      if (!optionRecord) {
        intersectIds([]);
      } else {
        const storedValues = String(optionRecord.values)
          .split(',')
          .map((v) => v.trim());
        const hasMatch = desiredValues.some((dv) => storedValues.includes(dv));
        intersectIds(hasMatch ? [optionRecord.product_id] : []);
      }
    }

    if (filteredProductIds !== null) {
      where.id = { [Op.in]: Array.from(filteredProductIds) };
    }

    const total = await Product.count({ where });

    const findOptions = {
      where,
      include: [
        { model: ProductImage, as: 'images' },
        { model: ProductOption, as: 'options' },
        { model: ProductCategory, as: 'productCategories' },
      ],
      order: [
        ['id', 'ASC'],
        [{ model: ProductImage, as: 'images' }, 'id', 'ASC'],
        [{ model: ProductOption, as: 'options' }, 'id', 'ASC'],
      ],
      distinct: true,
    };

    if (limit !== -1) {
      findOptions.limit = limit;
      findOptions.offset = (page - 1) * limit;
    }

    const rows = await Product.findAll(findOptions);

    return {
      data: rows.map((row) => formatProductOutput(row, requestedFields)),
      total,
      limit,
      page,
    };
  }

  static async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw createError(404, 'Produto não encontrado.');
    }

    const product = await Product.findByPk(numericId, {
      include: [
        { model: ProductImage, as: 'images' },
        { model: ProductOption, as: 'options' },
        { model: ProductCategory, as: 'productCategories' },
      ],
      order: [
        [{ model: ProductImage, as: 'images' }, 'id', 'ASC'],
        [{ model: ProductOption, as: 'options' }, 'id', 'ASC'],
      ],
    });

    if (!product) {
      throw createError(404, 'Produto não encontrado.');
    }

    return formatProductOutput(product);
  }

  static validateBaseProductFields(payload = {}, isUpdate = false) {
    const {
      enabled,
      name,
      slug,
      use_in_menu,
      stock,
      price,
      price_with_discount,
    } = payload;

    if (!isUpdate || name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        throw createError(400, 'O campo name é obrigatório.');
      }
    }

    if (!isUpdate || slug !== undefined) {
      if (!slug || typeof slug !== 'string' || !slug.trim()) {
        throw createError(400, 'O campo slug é obrigatório.');
      }
    }

    if (!isUpdate || price !== undefined) {
      if (price === undefined || price === null || typeof price !== 'number' || Number.isNaN(price) || price < 0) {
        throw createError(400, 'O campo price é obrigatório e deve ser um número válido.');
      }
    }

    if (!isUpdate || price_with_discount !== undefined) {
      if (
        price_with_discount === undefined ||
        price_with_discount === null ||
        typeof price_with_discount !== 'number' ||
        Number.isNaN(price_with_discount) ||
        price_with_discount < 0
      ) {
        throw createError(
          400,
          'O campo price_with_discount é obrigatório e deve ser um número válido.'
        );
      }
    }

    if (enabled !== undefined && typeof enabled !== 'boolean') {
      throw createError(400, 'O campo enabled deve ser booleano.');
    }

    if (use_in_menu !== undefined && typeof use_in_menu !== 'boolean') {
      throw createError(400, 'O campo use_in_menu deve ser booleano.');
    }

    if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
      throw createError(400, 'O campo stock deve ser um inteiro não negativo.');
    }
  }

  static async validateCategoryIds(categoryIds, transaction) {
    if (categoryIds === undefined) {
      return [];
    }

    if (!Array.isArray(categoryIds)) {
      throw createError(400, 'O campo category_ids deve ser um array de IDs.');
    }

    const uniqueIds = [...new Set(categoryIds.map((id) => Number(id)))];
    if (uniqueIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw createError(400, 'IDs de categoria inválidos em category_ids.');
    }

    if (uniqueIds.length > 0) {
      const existingCategories = await Category.findAll({
        where: { id: { [Op.in]: uniqueIds } },
        transaction,
      });

      if (existingCategories.length !== uniqueIds.length) {
        throw createError(400, 'Uma ou mais categorias informadas não existem.');
      }
    }

    return uniqueIds;
  }

  static async create(payload = {}) {
    this.validateBaseProductFields(payload, false);

    if (payload.images !== undefined && !Array.isArray(payload.images)) {
      throw createError(400, 'O campo images deve ser um array.');
    }

    if (payload.options !== undefined && !Array.isArray(payload.options)) {
      throw createError(400, 'O campo options deve ser um array.');
    }

    const transaction = await sequelize.transaction();

    try {
      const validCategoryIds = await this.validateCategoryIds(
        payload.category_ids,
        transaction
      );

      const product = await Product.create(
        {
          enabled: payload.enabled !== undefined ? payload.enabled : false,
          name: payload.name.trim(),
          slug: payload.slug.trim(),
          use_in_menu:
            payload.use_in_menu !== undefined ? payload.use_in_menu : false,
          stock: payload.stock !== undefined ? payload.stock : 0,
          description:
            payload.description !== undefined ? payload.description : null,
          price: payload.price,
          price_with_discount: payload.price_with_discount,
        },
        { transaction }
      );

      if (validCategoryIds.length > 0) {
        const categoryLinks = validCategoryIds.map((categoryId) => ({
          product_id: product.id,
          category_id: categoryId,
        }));
        await ProductCategory.bulkCreate(categoryLinks, { transaction });
      }

      if (Array.isArray(payload.images) && payload.images.length > 0) {
        const imageRecords = payload.images.map((img) => ({
          product_id: product.id,
          enabled: img.enabled !== undefined ? Boolean(img.enabled) : true,
          path: processImagePath(img),
        }));
        await ProductImage.bulkCreate(imageRecords, { transaction });
      }

      if (Array.isArray(payload.options) && payload.options.length > 0) {
        const optionRecords = payload.options.map((opt) => {
          if (!opt || !opt.title || typeof opt.title !== 'string' || !opt.title.trim()) {
            throw createError(400, 'O campo title é obrigatório em todas as opções.');
          }
          const shape = opt.shape !== undefined ? opt.shape : 'square';
          if (!VALID_SHAPES.includes(shape)) {
            throw createError(400, 'O campo shape da opção deve ser square ou circle.');
          }
          const type = opt.type !== undefined ? opt.type : 'text';
          if (!VALID_OPTION_TYPES.includes(type)) {
            throw createError(400, 'O campo type da opção deve ser text ou color.');
          }

          return {
            product_id: product.id,
            title: opt.title.trim(),
            shape,
            radius: parseRadius(opt.radius),
            type,
            values: normalizeOptionValuesToString(opt),
          };
        });
        await ProductOption.bulkCreate(optionRecords, { transaction });
      }

      await transaction.commit();

      return await this.getById(product.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async update(id, payload = {}) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw createError(404, 'Produto não encontrado.');
    }

    const product = await Product.findByPk(numericId);
    if (!product) {
      throw createError(404, 'Produto não encontrado.');
    }

    this.validateBaseProductFields(payload, true);

    if (payload.images !== undefined && !Array.isArray(payload.images)) {
      throw createError(400, 'O campo images deve ser um array.');
    }

    if (payload.options !== undefined && !Array.isArray(payload.options)) {
      throw createError(400, 'O campo options deve ser um array.');
    }

    const transaction = await sequelize.transaction();

    try {
      await product.update(
        {
          enabled:
            payload.enabled !== undefined ? payload.enabled : product.enabled,
          name: payload.name !== undefined ? payload.name.trim() : product.name,
          slug: payload.slug !== undefined ? payload.slug.trim() : product.slug,
          use_in_menu:
            payload.use_in_menu !== undefined
              ? payload.use_in_menu
              : product.use_in_menu,
          stock: payload.stock !== undefined ? payload.stock : product.stock,
          description:
            payload.description !== undefined
              ? payload.description
              : product.description,
          price: payload.price !== undefined ? payload.price : product.price,
          price_with_discount:
            payload.price_with_discount !== undefined
              ? payload.price_with_discount
              : product.price_with_discount,
        },
        { transaction }
      );

      if (payload.category_ids !== undefined) {
        const validCategoryIds = await this.validateCategoryIds(
          payload.category_ids,
          transaction
        );
        await ProductCategory.destroy({
          where: { product_id: product.id },
          transaction,
        });

        if (validCategoryIds.length > 0) {
          const categoryLinks = validCategoryIds.map((categoryId) => ({
            product_id: product.id,
            category_id: categoryId,
          }));
          await ProductCategory.bulkCreate(categoryLinks, { transaction });
        }
      }

      if (Array.isArray(payload.images)) {
        for (const img of payload.images) {
          if (img.id !== undefined) {
            const imgId = Number(img.id);
            const existingImg = await ProductImage.findOne({
              where: { id: imgId, product_id: product.id },
              transaction,
            });

            if (!existingImg) {
              throw createError(400, `Imagem com id ${img.id} não pertence a este produto.`);
            }

            if (img.deleted === true) {
              await existingImg.destroy({ transaction });
            } else {
              const updatedFields = {};
              if (img.enabled !== undefined) {
                updatedFields.enabled = Boolean(img.enabled);
              }
              if (img.content !== undefined || img.path !== undefined) {
                updatedFields.path = processImagePath(img);
              }
              if (Object.keys(updatedFields).length > 0) {
                await existingImg.update(updatedFields, { transaction });
              }
            }
          } else if (!img.deleted) {
            await ProductImage.create(
              {
                product_id: product.id,
                enabled: img.enabled !== undefined ? Boolean(img.enabled) : true,
                path: processImagePath(img),
              },
              { transaction }
            );
          }
        }
      }

      if (Array.isArray(payload.options)) {
        for (const opt of payload.options) {
          if (opt.id !== undefined) {
            const optId = Number(opt.id);
            const existingOpt = await ProductOption.findOne({
              where: { id: optId, product_id: product.id },
              transaction,
            });

            if (!existingOpt) {
              throw createError(400, `Opção com id ${opt.id} não pertence a este produto.`);
            }

            if (opt.deleted === true) {
              await existingOpt.destroy({ transaction });
            } else {
              const updatedOpt = {};
              if (opt.title !== undefined) {
                if (typeof opt.title !== 'string' || !opt.title.trim()) {
                  throw createError(400, 'O campo title da opção não pode ser vazio.');
                }
                updatedOpt.title = opt.title.trim();
              }
              if (opt.shape !== undefined) {
                if (!VALID_SHAPES.includes(opt.shape)) {
                  throw createError(400, 'O campo shape da opção deve ser square ou circle.');
                }
                updatedOpt.shape = opt.shape;
              }
              if (opt.radius !== undefined) {
                updatedOpt.radius = parseRadius(opt.radius);
              }
              if (opt.type !== undefined) {
                if (!VALID_OPTION_TYPES.includes(opt.type)) {
                  throw createError(400, 'O campo type da opção deve ser text ou color.');
                }
                updatedOpt.type = opt.type;
              }
              if (opt.values !== undefined || opt.value !== undefined) {
                updatedOpt.values = normalizeOptionValuesToString(opt);
              }

              await existingOpt.update(updatedOpt, { transaction });
            }
          } else if (!opt.deleted) {
            if (!opt.title || typeof opt.title !== 'string' || !opt.title.trim()) {
              throw createError(400, 'O campo title é obrigatório para nova opção.');
            }
            const shape = opt.shape !== undefined ? opt.shape : 'square';
            if (!VALID_SHAPES.includes(shape)) {
              throw createError(400, 'O campo shape da opção deve ser square ou circle.');
            }
            const type = opt.type !== undefined ? opt.type : 'text';
            if (!VALID_OPTION_TYPES.includes(type)) {
              throw createError(400, 'O campo type da opção deve ser text ou color.');
            }

            await ProductOption.create(
              {
                product_id: product.id,
                title: opt.title.trim(),
                shape,
                radius: parseRadius(opt.radius),
                type,
                values: normalizeOptionValuesToString(opt),
              },
              { transaction }
            );
          }
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async delete(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw createError(404, 'Produto não encontrado.');
    }

    const product = await Product.findByPk(numericId);
    if (!product) {
      throw createError(404, 'Produto não encontrado.');
    }

    const transaction = await sequelize.transaction();
    try {
      await ProductCategory.destroy({
        where: { product_id: product.id },
        transaction,
      });
      await ProductImage.destroy({
        where: { product_id: product.id },
        transaction,
      });
      await ProductOption.destroy({
        where: { product_id: product.id },
        transaction,
      });
      await product.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = ProductService;
