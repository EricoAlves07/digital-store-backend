const CategoryService = require('../services/CategoryService');

class CategoryController {
  static async search(req, res, next) {
    try {
      const result = await CategoryService.search(req.query);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const category = await CategoryService.getById(req.params.id);
      return res.status(200).json(category);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const category = await CategoryService.create(req.body);
      return res.status(201).json(category);
    } catch (error) {
      return next(error);
    }
  }

  static async update(req, res, next) {
    try {
      await CategoryService.update(req.params.id, req.body);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await CategoryService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = CategoryController;
