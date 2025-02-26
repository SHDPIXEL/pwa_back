const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const CodeTracker = sequelize.define(
  "CodeTracker",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    latestNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100, // Start from 100
    },
  },
  { timestamps: true }
);

// Sync with error handling
(async () => {
  try {
    await CodeTracker.sync({ force: false });
    console.log("The table for the CodeTracker model was just (re)created!");
  } catch (error) {
    console.error("Error syncing the CodeTracker model:", error);
  }
})();

module.exports = CodeTracker;
