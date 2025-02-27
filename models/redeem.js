const { DataTypes } = require("sequelize");
const sequelize = require("../connection");
const User = require("./user");
const Rewards = require("./rewards");

const Redeem = sequelize.define("Redeem", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
  rewardId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Rewards,
      key: "id",
    },
  },
  redeemedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Ensure associations are applied here too
Rewards.hasMany(Redeem, { foreignKey: "rewardId", as: "redemptions" });
Redeem.belongsTo(Rewards, { foreignKey: "rewardId", as: "reward" });

User.hasMany(Redeem, { foreignKey: "userId", as: "redemptions" });
Redeem.belongsTo(User, { foreignKey: "userId", as: "user" });

// Sync with error handling
(async () => {
  try {
    await Redeem.sync({ force: false });
    console.log("The table for the Redeem model was just (re)created!");
  } catch (error) {
    console.error("Error syncing the Redeem model:", error);
  }
})();

module.exports = Redeem;
