const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: 'Token de autenticação não fornecido.',
    });
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0]) || !parts[1]) {
    return res.status(401).json({
      message: 'Formato de token inválido. Utilize: Bearer <token>',
    });
  }

  const token = parts[1];

  try {
    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido ou expirado.',
    });
  }
};

module.exports = authMiddleware;
