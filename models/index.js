const Rewards = require("./rewards");
const Redeem = require("./redeem");
const User = require("./user");
const Payment = require("./payment");
const Orders = require("./order");
const Product = require("./products");

// Associations
Rewards.hasMany(Redeem, { foreignKey: "rewardId", as: "redemptions" });
Redeem.belongsTo(Rewards, { foreignKey: "rewardId", as: "reward" });

User.hasMany(Redeem, { foreignKey: "userId", as: "redemptions" });
Redeem.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Payment, { foreignKey: "userId", onDelete: "CASCADE" });
Payment.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Orders, { foreignKey: "userId", onDelete: "CASCADE" });
Orders.belongsTo(User, { foreignKey: "userId" });

Orders.hasOne(Payment, {
  foreignKey: "orderId",
  sourceKey: "orderId",
  as: "Order",
});
Payment.belongsTo(Orders, {
  foreignKey: "orderId",
  targetKey: "orderId",
  as: "Order",
});

Orders.belongsTo(Product, { foreignKey: "productId", as: "Product" });
Product.hasMany(Orders, { foreignKey: "productId", as: "Orders" });

// Export models
module.exports = { Rewards, Redeem, User, Orders, Product, Payment };
