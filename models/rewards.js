const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Rewards = sequelize.define(
  "Rewards",
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
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      allowNull: false,
    },
    reward_image: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    timestamps: true,
  }
);

// Sync with error handling
(async () => {
  try {
    await Rewards.sync({ force: false });
    console.log("The table for the Reward model was just (re)created!");
  } catch (error) {
    console.error("Error syncing the Reward model:", error);
  }
})();

module.exports = Rewards;
