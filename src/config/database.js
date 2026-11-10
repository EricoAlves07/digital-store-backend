require('dotenv').config({ quiet: true });

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || null,
    database: process.env.DB_NAME || 'digital_store',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  test: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || null,
    database: process.env.DB_NAME_TEST || 'digital_store_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  },
};
