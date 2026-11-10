'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProductOption = sequelize.define(
    'ProductOption',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      shape: {
        type: DataTypes.ENUM('square', 'circle'),
        allowNull: true,
        defaultValue: 'square',
      },
      radius: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      type: {
        type: DataTypes.ENUM('text', 'color'),
        allowNull: true,
        defaultValue: 'text',
      },
      values: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'product_options',
      underscored: true,
      timestamps: true,
    }
  );

  ProductOption.associate = (models) => {
    ProductOption.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product',
    });
  };

  return ProductOption;
};
