const { DataTypes } = require("sequelize");
const sequelize = require("../connection");
const User = require("../models/user");
const Challenges = require("../models/challenges");

const ChallengeSubmitForm = sequelize.define(
  "ChallengeSubmitForm",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      // Foreign key reference to User
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    challengeId: {
      // Foreign key reference to User
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Challenges,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mediaType: {
      type: DataTypes.ENUM("images", "video"),
      allowNull: false,
    },
    mediaFiles: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        maxFiles(value) {
          if (
            this.mediaType === "images" &&
            Array.isArray(value) &&
            value.length > 5
          ) {
            throw new Error("Maximum 5 images allowed.");
          }
          if (
            this.mediaType === "video" &&
            Array.isArray(value) &&
            value.length > 1
          ) {
            throw new Error("Only 1 video is allowed.");
          }
        },
      },
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
      allowNull: false,
      defaultValue: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Sync with error handling
(async () => {
  try {
    await ChallengeSubmitForm.sync({ force: false });
    console.log("The table for the ChallengeSubmitForm model was just (re)created!");
  } catch (error) {
    console.error("Error syncing the ChallengeSubmitForm model:", error);
  }
})();

module.exports = ChallengeSubmitForm;
