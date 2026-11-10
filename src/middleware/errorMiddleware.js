const errorMiddleware = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      message: 'JSON inválido no corpo da requisição.',
    });
  }

  if (
    err.name === 'SequelizeValidationError' ||
    err.name === 'SequelizeUniqueConstraintError'
  ) {
    const details = Array.isArray(err.errors)
      ? err.errors.map((e) => e.message).join('; ')
      : err.message;
    return res.status(400).json({
      message: details || 'Erro de validação nos dados informados.',
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Erro interno do servidor.';

  return res.status(statusCode).json({
    message,
  });
};

module.exports = errorMiddleware;
