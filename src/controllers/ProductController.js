const ProductService = require('../services/ProductService');

class ProductController {
  static async search(req, res, next) {
    try {
      const result = await ProductService.search(req.query);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const product = await ProductService.getById(req.params.id);
      return res.status(200).json(product);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const product = await ProductService.create(req.body);
      return res.status(201).json(product);
    } catch (error) {
      return next(error);
    }
  }

  static async update(req, res, next) {
    try {
      await ProductService.update(req.params.id, req.body);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await ProductService.delete(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = ProductController;
