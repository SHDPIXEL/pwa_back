const { DataTypes } = require("sequelize");
const sequelize = require("../connection");
const Week = require("./weeks");

const Challenges = sequelize.define(
  "Challenges",
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
    shortDescription: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descriptions: {
      type: DataTypes.JSON, // Store descriptions as an array
      allowNull: true,
    },
    challenge_images: {
      type: DataTypes.JSON, // Store images as an array
      allowNull: true,
      defaultValue: [],
    },
    rewards: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive"),
      allowNull: false,
    },
    weekId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Week,
        key: "id",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Association
Challenges.belongsTo(Week, {
  foreignKey: "weekId",
  as: "week",
});
Week.hasMany(Challenges, {
  foreignKey: "weekId",
  as: "challenges",
});

// Sync with error handling
(async () => {
  try {
    await Challenges.sync({ force: false });
    console.log("The table for the Challenges model was just (re)created!");
  } catch (error) {
    console.error("Error syncing the Challenges model:", error);
  }
})();

module.exports = Challenges;
