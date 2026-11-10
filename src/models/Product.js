'use strict';

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      use_in_menu: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      price_with_discount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      tableName: 'products',
      underscored: true,
      timestamps: true,
    }
  );

  Product.associate = (models) => {
    Product.hasMany(models.ProductImage, {
      foreignKey: 'product_id',
      as: 'images',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Product.hasMany(models.ProductOption, {
      foreignKey: 'product_id',
      as: 'options',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Product.belongsToMany(models.Category, {
      through: models.ProductCategory,
      foreignKey: 'product_id',
      otherKey: 'category_id',
      as: 'categories',
    });

    Product.hasMany(models.ProductCategory, {
      foreignKey: 'product_id',
      as: 'productCategories',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Product;
};
