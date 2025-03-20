const { DataTypes } = require("sequelize");
const sequelize = require("../connection");
const Products = require("./products")

const Orders = sequelize.define(
  "Orders",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paymentId:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Products, // 👈 MUST match the actual table name in DB
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Completed", "Cancelled"),
      allowNull: false,
      defaultValue: "Pending",
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
  }
);


(async () => {
  try {
    await Orders.sync({ force: true });
    console.log("Orders table synchronized.");
  } catch (error) {
    console.error("Error syncing Orders model:", error);
  }
})();

module.exports = Orders;
