const { Category } = require('../models');

const ALLOWED_FIELDS = ['id', 'name', 'slug', 'use_in_menu'];

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

class CategoryService {
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

    const where = {};
    if (query.use_in_menu !== undefined && query.use_in_menu !== '') {
      const rawUseInMenu = String(query.use_in_menu).toLowerCase();
      if (rawUseInMenu === 'true') {
        where.use_in_menu = true;
      } else if (rawUseInMenu === 'false') {
        where.use_in_menu = false;
      } else {
        throw createError(400, 'Parâmetro use_in_menu deve ser booleano (true ou false).');
      }
    }

    let attributes = ALLOWED_FIELDS;
    if (query.fields !== undefined && query.fields !== '') {
      const requestedFields = String(query.fields)
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      if (requestedFields.length === 0) {
        throw createError(400, 'Parâmetro fields inválido.');
      }

      const invalidField = requestedFields.find(
        (field) => !ALLOWED_FIELDS.includes(field)
      );
      if (invalidField) {
        throw createError(400, `Campo inválido em fields: ${invalidField}`);
      }

      attributes = requestedFields.includes('id')
        ? requestedFields
        : ['id', ...requestedFields];
    }

    const findOptions = {
      where,
      attributes,
      order: [['id', 'ASC']],
    };

    if (limit !== -1) {
      findOptions.limit = limit;
      findOptions.offset = (page - 1) * limit;
    }

    const { count, rows } = await Category.findAndCountAll(findOptions);

    return {
      data: rows.map((row) => row.toJSON()),
      total: count,
      limit,
      page,
    };
  }

  static async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw createError(404, 'Categoria não encontrada.');
    }

    const category = await Category.findByPk(numericId, {
      attributes: ALLOWED_FIELDS,
    });

    if (!category) {
      throw createError(404, 'Categoria não encontrada.');
    }

    return category.toJSON();
  }

  static async create(payload = {}) {
    const { name, slug, use_in_menu } = payload;

    if (
      !name ||
      typeof name !== 'string' ||
      !name.trim() ||
      !slug ||
      typeof slug !== 'string' ||
      !slug.trim()
    ) {
      throw createError(400, 'Os campos name e slug são obrigatórios.');
    }

    if (use_in_menu !== undefined && typeof use_in_menu !== 'boolean') {
      throw createError(400, 'O campo use_in_menu deve ser um booleano.');
    }

    const category = await Category.create({
      name: name.trim(),
      slug: slug.trim(),
      use_in_menu: use_in_menu !== undefined ? use_in_menu : false,
    });

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      use_in_menu: category.use_in_menu,
    };
  }

  static async update(id, payload = {}) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw createError(404, 'Categoria não encontrada.');
    }

    const category = await Category.findByPk(numericId);
    if (!category) {
      throw createError(404, 'Categoria não encontrada.');
    }

    const { name, slug, use_in_menu } = payload;

    if (
      !name ||
      typeof name !== 'string' ||
      !name.trim() ||
      !slug ||
      typeof slug !== 'string' ||
      !slug.trim()
    ) {
      throw createError(400, 'Os campos name e slug são obrigatórios.');
    }

    if (use_in_menu !== undefined && typeof use_in_menu !== 'boolean') {
      throw createError(400, 'O campo use_in_menu deve ser um booleano.');
    }

    await category.update({
      name: name.trim(),
      slug: slug.trim(),
      use_in_menu:
        use_in_menu !== undefined ? use_in_menu : category.use_in_menu,
    });
  }

  static async delete(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw createError(404, 'Categoria não encontrada.');
    }

    const category = await Category.findByPk(numericId);
    if (!category) {
      throw createError(404, 'Categoria não encontrada.');
    }

    await category.destroy();
  }
}

module.exports = CategoryService;
