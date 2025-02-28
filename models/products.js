const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Products = sequelize.define(
  "Products",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    oldPrice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    priceForDoctor: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    priceForOtherUser: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    product_image: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      allowNull: false,
    },
    inStock: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // true = In Stock, false = Out of Stock
    },
  },
  {
    timestamps: true,
  }
);

// Sync with error handling
(async () => {
  try {
    await Products.sync({ force: false });
    console.log("The table for the product model was just (re)created!");
  } catch (error) {
    console.error("Error syncing the Product model:", error);
  }
})();

module.exports = Products;
