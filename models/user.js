const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const User = sequelize.define(
  "User",
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
    phone: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null to enable conditional login
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null to enable conditional login
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      allowNull: false,
      defaultValue: "Active",
    },
    userType: {
      type: DataTypes.ENUM("Doctor", "OtherUser"),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: function () {
        return this.userType === "OtherUser"; // Required for OtherUsers
      },
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: function () {
        return this.userType === "Doctor"; // Only applicable for doctors
      },
    },
    state: {
      type: DataTypes.STRING,
      allowNull: function () {
        return this.userType === "Doctor"; // Required for Doctor
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: "Password cannot be empty",
        },
        len: {
          args: [8, 100],
          msg: "Password must be between 8 and 100 characters.",
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Sync with error handling
(async () => {
  try {
    await User.sync({ force: false });
    console.log("The table for the User model was just (re)created!");
  } catch (error) {
    console.error("Error syncing the User model:", error);
  }
})();

module.exports = User;
