const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Payment = sequelize.define("Payment", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
  status: {
    type: DataTypes.ENUM("pending", "completed", "failed"),
    defaultValue: "pending",
  },
},
{
  timestamps: true, // Adds createdAt and updatedAt fields
});

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
