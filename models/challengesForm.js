const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const ChallengeSubmitForm = sequelize.define(
  "ChallengeSubmitForm",
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
  },
  {
    timestamps: true,
  }
);

// Sync with error handling
(async () => {
    try {
      await ChallengeSubmitForm.sync({ force: false });
      console.log("The table for the Agent model was just (re)created!");
    } catch (error) {
      console.error("Error syncing the Agent model:", error);
    }
  })();

module.exports = ChallengeSubmitForm;
