const Rewards = require("./rewards");
const Redeem = require("./redeem");
const User = require("./user");

// Define associations
Rewards.hasMany(Redeem, { foreignKey: "rewardId", as: "redemptions" });
Redeem.belongsTo(Rewards, { foreignKey: "rewardId", as: "reward" });

User.hasMany(Redeem, { foreignKey: "userId", as: "redemptions" });
Redeem.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = { Rewards, Redeem, User };