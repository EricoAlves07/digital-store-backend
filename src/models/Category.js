'use strict';

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
    },
    {
      tableName: 'categories',
      underscored: true,
      timestamps: true,
    }
  );

  Category.associate = (models) => {
    Category.belongsToMany(models.Product, {
      through: models.ProductCategory,
      foreignKey: 'category_id',
      otherKey: 'product_id',
      as: 'products',
    });
  };

  return Category;
};
