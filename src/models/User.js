'use strict';

const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      firstname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      surname: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
      hooks: {
        beforeSave: async (user) => {
          if (user.changed('password') && user.password) {
            const isAlreadyHashed = /^\$2[aby]\$\d{2}\$/.test(user.password);
            if (!isAlreadyHashed) {
              user.password = await bcrypt.hash(user.password, 10);
            }
          }
        },
      },
    }
  );

  User.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  };

  return User;
};
