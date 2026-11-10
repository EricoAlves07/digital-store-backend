const UserService = require('../services/UserService');

class UserController {
  static async getById(req, res, next) {
    try {
      const user = await UserService.getById(req.params.id);
      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const user = await UserService.create(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return next(error);
    }
  }

  static async update(req, res, next) {
    try {
      await UserService.update(req.params.id, req.body, req.user);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      await UserService.delete(req.params.id, req.user);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  static async generateToken(req, res, next) {
    try {
      const result = await UserService.generateToken(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = UserController;
