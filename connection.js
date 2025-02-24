const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("bereboot", "admin_bereboot", "T14wAql4UU1Kp67OzIAx", {
  host: "bereboot-pwa.ch26co64cgxa.ap-south-1.rds.amazonaws.com",
  dialect: "mysql",
});

sequelize.authenticate();
try {
  console.log("Database Connected Succesfully");
} catch (error) {
  console.log("Unable to connect to the database:", error);
}

sequelize.authenticate().then(() => console.log("Database Connected"));

module.exports = sequelize;
