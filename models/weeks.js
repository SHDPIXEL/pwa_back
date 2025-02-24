const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Week = sequelize.define(
  "Week",
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
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

// Sync with error handling
(async () => {
  try {
    await Week.sync({ force: false });
    console.log("The table for the Week model was just (re)created!");
  } catch (error) {
    console.error("Error syncing the Week model:", error);
  }
})();

module.exports = Week;
