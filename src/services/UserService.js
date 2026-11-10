const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

class UserService {
  static async getById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw createError(404, 'Usuário não encontrado.');
    }

    const user = await User.findByPk(numericId, {
      attributes: ['id', 'firstname', 'surname', 'email'],
    });

    if (!user) {
      throw createError(404, 'Usuário não encontrado.');
    }

    return {
      id: user.id,
      firstname: user.firstname,
      surname: user.surname,
      email: user.email,
    };
  }

  static async create(payload = {}) {
    const { firstname, surname, email, password, confirmPassword } = payload;

    if (
      !firstname ||
      typeof firstname !== 'string' ||
      !firstname.trim() ||
      !surname ||
      typeof surname !== 'string' ||
      !surname.trim() ||
      !email ||
      typeof email !== 'string' ||
      !email.trim() ||
      !password ||
      typeof password !== 'string' ||
      !confirmPassword ||
      typeof confirmPassword !== 'string'
    ) {
      throw createError(400, 'Todos os campos obrigatórios devem ser preenchidos.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw createError(400, 'Formato de e-mail inválido.');
    }

    if (password !== confirmPassword) {
      throw createError(400, 'A confirmação de senha não confere.');
    }

    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw createError(400, 'E-mail já cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstname: firstname.trim(),
      surname: surname.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return {
      id: user.id,
      firstname: user.firstname,
      surname: user.surname,
      email: user.email,
    };
  }

  static async update(id, payload = {}, authenticatedUser = null) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw createError(404, 'Usuário não encontrado.');
    }

    const user = await User.findByPk(numericId);
    if (!user) {
      throw createError(404, 'Usuário não encontrado.');
    }

    if (authenticatedUser && Number(authenticatedUser.id) !== user.id) {
      throw createError(403, 'Acesso negado: não é permitido alterar dados de outro usuário.');
    }

    const { firstname, surname, email } = payload;

    if (
      !firstname ||
      typeof firstname !== 'string' ||
      !firstname.trim() ||
      !surname ||
      typeof surname !== 'string' ||
      !surname.trim() ||
      !email ||
      typeof email !== 'string' ||
      !email.trim()
    ) {
      throw createError(400, 'Os campos firstname, surname e email são obrigatórios.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw createError(400, 'Formato de e-mail inválido.');
    }

    const emailInUse = await User.findOne({
      where: {
        email: normalizedEmail,
        id: { [Op.ne]: user.id },
      },
    });

    if (emailInUse) {
      throw createError(400, 'E-mail já está em uso por outro usuário.');
    }

    await user.update({
      firstname: firstname.trim(),
      surname: surname.trim(),
      email: normalizedEmail,
    });
  }

  static async delete(id, authenticatedUser = null) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw createError(404, 'Usuário não encontrado.');
    }

    const user = await User.findByPk(numericId);
    if (!user) {
      throw createError(404, 'Usuário não encontrado.');
    }

    if (authenticatedUser && Number(authenticatedUser.id) !== user.id) {
      throw createError(403, 'Acesso negado: não é permitido excluir outro usuário.');
    }

    await user.destroy();
  }

  static async generateToken(payload = {}) {
    const { email, password } = payload;

    if (
      !email ||
      typeof email !== 'string' ||
      !email.trim() ||
      !password ||
      typeof password !== 'string'
    ) {
      throw createError(400, 'E-mail e senha são obrigatórios.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw createError(400, 'E-mail ou senha inválidos.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError(400, 'E-mail ou senha inválidos.');
    }

    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      secret,
      { expiresIn }
    );

    return { token };
  }
}

module.exports = UserService;
