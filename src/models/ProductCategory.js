'use strict';

module.exports = (sequelize, DataTypes) => {
  const ProductCategory = sequelize.define(
    'ProductCategory',
    {
      product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      category_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
    },
    {
      tableName: 'product_categories',
      underscored: true,
      timestamps: true,
    }
  );

  ProductCategory.associate = (models) => {
    ProductCategory.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product',
    });

    ProductCategory.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category',
    });
  };

  return ProductCategory;
};
