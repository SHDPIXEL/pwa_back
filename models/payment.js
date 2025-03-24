const { DataTypes } = require("sequelize");
const sequelize = require("../connection");
const Orders = require("./order");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      // Foreign key reference to User
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    orderId: {
      // Foreign key reference to order
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: Orders,
        key: "orderId",
      },
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Transaction ID cannot be empty",
        },
      },
    },
    paymentScreenshot: {
      type: DataTypes.STRING, // Stores a single image URL
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM("Verifying", "Verified", "Rejected"),
      defaultValue: "Verifying", // Admin will update this
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      allowNull: false,
      defaultValue: "Active",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Name cannot be empty",
        },
      },
    },
    image: {
      type: DataTypes.STRING, // Stores a single image URL
      allowNull: true, // Make it optional
    },
    address: {
      type: DataTypes.STRING, // New address field
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Address cannot be empty",
        },
      },
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Define association
Orders.hasOne(Payment, { foreignKey: "orderId", sourceKey: "orderId" });
Payment.belongsTo(Orders, { foreignKey: "orderId", targetKey: "orderId" });

// Sync model with database
(async () => {
  try {
    await Payment.sync({ force: false });
    console.log("The table for the Payment model was just (re)created!");
  } catch (error) {
    console.error("Error syncing the Payment model:", error);
  }
})();

module.exports = Payment;
