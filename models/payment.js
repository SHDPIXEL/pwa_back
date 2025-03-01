const { DataTypes } = require("sequelize");
const sequelize = require("../connection");
const User = require("./user");

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
      references: {
        model: User,
        key: "id",
      },
    },
    txnid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Transaction ID cannot be empty",
        },
      },
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Amount cannot be empty",
        },
        min: {
          args: [0.01],
          msg: "Amount must be greater than 0",
        },
      },
    },
    productinfo: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Product info cannot be empty",
        },
      },
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "First name cannot be empty",
        },
      },
    },
    quantity:{
      type: DataTypes.INTEGER,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: {
          msg: "Invalid email format",
        },
        notEmpty: {
          msg: "Email cannot be empty",
        },
      },
    },
    payuId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "success", "failed"),
      defaultValue: "pending",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

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
