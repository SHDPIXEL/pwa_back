const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Week = require("../models/weeks");
const Challenges = require("../models/challenges");
const Products = require("../models/products");
const ChallengeSubmitForm = require("../models/challengesForm");
const Rewards = require("../models/rewards");
const Redeem = require("../models/redeem");
const Orders = require("../models/order");
const Product = require("../models/products");
const Payment = require("../models/payment");
const uploadMedia = require("../middleware/uploadMiddleware");
const fs = require("fs");
const path = require("path");
const sequelize = require("../connection");

const getUserdetailsById = async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(403).json({ error: "Token is required" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract user ID from the decoded token
    const userId = decoded.id;

    // Find the user in the database
    const user = await User.findOne({
      where: { id: userId },
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ message: "User found", user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res
      .status(500)
      .json({ error: `Error fetching user: ${error.message}` });
  }
};

const updateUser = async (req, res) => {
  try {
    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1]; // Assuming "Bearer <token>"
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Verify and decode the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded Token user:", decoded);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = decoded?.id; // Extract userId from the token
    if (!userId) {
      return res.status(400).json({ error: "Invalid token, userId missing" });
    }

    // Find user by extracted userId
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] }, // Exclude password from retrieval
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract fields from request body
    const { name, phone, email, gender, status, state } = req.body;

    // Validate status
    if (status && !["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Validate email uniqueness if updating
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // Validate phone uniqueness if updating
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ where: { phone } });
      if (phoneExists) {
        return res.status(400).json({ error: "Phone number already in use" });
      }
    }
    // Log old values before updating
    console.log("Before update:", user.toJSON());

    // Update user fields (excluding password)
    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      email: email || user.email,
      gender: gender || user.gender,
      status: status || user.status,
      state: state || user.state,
    });
    // Refresh user from DB
    await user.reload();

    // Debugging: Log new values after update
    console.log("After update:", user.toJSON());

    return res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getWeeksByDoctor = async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(403).json({ error: "Token is required" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract user ID from the decoded token
    const userId = decoded.id;

    // Find the user in the database
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(403).json({ error: "Access denied. User not found." });
    }

    // Check if the user is a doctor
    if (user.userType !== "Doctor") {
      return res.status(403).json({
        error: "Access denied. Only doctors can access this resource.",
      });
    }

    // Fetch all weeks assigned to this doctor
    const weeks = await Week.findAll();

    if (!weeks.length) {
      return res.status(404).json({ error: "No weeks found for this doctor" });
    }

    return res.status(200).json(weeks);
  } catch (error) {
    console.error("Error fetching weeks:", error);
    return res
      .status(500)
      .json({ error: `Error fetching weeks: ${error.message}` });
  }
};

const getChallengesByDoctor = async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(403).json({ error: "Token is required" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract user ID from the decoded token
    const userId = decoded.id;

    // Find the user in the database
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(403).json({ error: "Access denied. User not found." });
    }

    // Check if the user is a doctor
    if (user.userType !== "Doctor") {
      return res.status(403).json({
        error: "Access denied. Only doctors can access this resource.",
      });
    }

    // Get weekId from frontend request
    const { weekId } = req.params; // Assuming it's passed as a route parameter

    if (!weekId) {
      return res.status(400).json({ error: "weekId is required" });
    }

    // Fetch challenges for the provided weekId
    const challenges = await Challenges.findAll({
      where: { weekId },
      include: [{ model: Week, as: "week" }],
    });

    if (!challenges.length) {
      return res
        .status(404)
        .json({ error: "No challenges found for this week" });
    }

    // Fetch the count of submitted forms for each challenge
    const challengesWithCount = await Promise.all(
      challenges.map(async (challenge) => {
        const submissionCount = await ChallengeSubmitForm.count({
          where: { challengeId: challenge.id },
        });

        return {
          ...challenge.dataValues,
          submissionCount, // Add count of submitted forms
        };
      })
    );

    return res.status(200).json(challengesWithCount);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return res
      .status(500)
      .json({ error: `Error fetching challenges: ${error.message}` });
  }
};

const getAllProducts = async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(403).json({ error: "Token is required" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract user ID and userType from the decoded token
    const { id: userId, userType } = decoded;

    // Find the user in the database
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(403).json({ error: "Access denied. User not found." });
    }

    // Fetch all products
    const products = await Products.findAll();

    if (!products.length) {
      return res.status(404).json({ error: "No products found" });
    }

    // Filter product details based on userType
    const filteredProducts = products.map((product) => {
      const { priceForDoctor, priceForOtherUser, ...otherDetails } =
        product.toJSON();

      return {
        ...otherDetails,
        price: userType === "Doctor" ? priceForDoctor : priceForOtherUser, // Send only relevant price
      };
    });

    return res.status(200).json(filteredProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res
      .status(500)
      .json({ error: `Error fetching products: ${error.message}` });
  }
};

const getAllRewards = async (req, res) => {
  try {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(403).json({ error: "Token is required" });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract user ID from the decoded token
    const userId = decoded.id;

    // Find the user in the database
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(403).json({ error: "Access denied. User not found." });
    }

    // Fetch all rewards with redemption count
    const rewards = await Rewards.findAll({
      include: [
        {
          model: Redeem,
          as: "redemptions", // Must match alias in models/index.js
          attributes: ["id"],
        },
      ],
    });

    if (!rewards.length) {
      return res.status(404).json({ error: "No rewards found" });
    }

    // Format rewards to include redemption count
    const formattedRewards = rewards.map((reward) => ({
      ...reward.toJSON(),
      redeemedCount: reward.redemptions ? reward.redemptions.length : 0,
    }));

    return res.status(200).json(formattedRewards);
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return res
      .status(500)
      .json({ error: `Error fetching rewards: ${error.message}` });
  }
};

const redeemReward = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(403).json({ error: "Token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;

    const { rewardId } = req.body;

    if (!rewardId) {
      return res.status(400).json({ error: "Reward ID is required" });
    }

    // Check if the reward exists
    const reward = await Rewards.findOne({ where: { id: rewardId } });

    if (!reward) {
      return res.status(404).json({ error: "Reward not found" });
    }

    // Fetch user details
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user has enough points
    if (user.points < reward.points) {
      return res.status(400).json({
        error:
          "Your points are less than the reward points, so you can't redeem the reward.",
      });
    }

    // Deduct reward points from the user
    await user.update({ points: user.points - reward.points });

    // Create redemption entry
    const redemption = await Redeem.create({ userId, rewardId });

    return res.status(201).json({
      message: "Reward redeemed successfully",
      remainingPoints: user.points - reward.points,
      redemption,
    });
  } catch (error) {
    console.error("Error redeeming reward:", error);
    return res
      .status(500)
      .json({ error: `Error redeeming reward: ${error.message}` });
  }
};

const getUserRedeemedRewards = async (req, res) => {
  try {
    // Get token from headers
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(403).json({ error: "Token is required" });
    }

    // Decode the token to get userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Check if the user exists
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the rewards the user has redeemed
    const redeemedRewards = await Redeem.findAll({
      where: { userId },
      include: [
        {
          model: Rewards,
          as: "reward", // Use alias 'reward' here
          attributes: ["id", "name", "description", "reward_image", "points"], // Add description and reward_image here
        },
      ],
      attributes: ["redeemedAt"], // Include redeemedAt from Redeem model
    });

    // If no rewards have been redeemed by the user
    if (redeemedRewards.length === 0) {
      return res.status(200).json({
        message: "User has not redeemed any rewards.",
        redeemedRewardIds: [],
        redeemedRewardDetails: [],
      });
    }

    // Get the IDs of the redeemed rewards
    const redeemedRewardIds = redeemedRewards.map((redeem) => redeem.reward.id);

    // Get the details of the redeemed rewards
    const redeemedRewardDetails = redeemedRewards.map((redeem) => ({
      id: redeem.reward.id,
      name: redeem.reward.name,
      description: redeem.reward.description,
      reward_image: redeem.reward.reward_image,
      points: redeem.reward.points,
      redeemedAt: redeem.redeemedAt, // Include the redeemedAt timestamp
    }));

    return res.status(200).json({
      message: "User has redeemed the following rewards.",
      redeemedRewardIds, // Array of reward IDs
      redeemedRewardDetails, // Array of reward details
    });
  } catch (error) {
    console.error("Error fetching redeemed rewards:", error);
    return res
      .status(500)
      .json({ error: `Error fetching redeemed rewards: ${error.message}` });
  }
};

const submitChallengeForm = async (req, res) => {
  try {
    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1]; // Assuming "Bearer <token>"
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Verify and decode the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded Token user:", decoded); // Debugging Log
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = decoded?.id;

    if (!userId) {
      console.error("Error: userId is undefined in token");
      return res.status(400).json({ error: "Invalid token, userId missing" });
    }

    // Handle media upload
    const upload = uploadMedia("challengesForm").array("mediaFiles", 5);

    upload(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      const { name, phone, remark, mediaType, challengeId } = req.body;
      console.log("Media Type:", mediaType);

      // Validate required fields
      if (!name || !phone || !mediaType || !challengeId) {
        return res.status(400).json({
          error: "Name, phone, mediaType, and challengeId are required.",
        });
      }

      if (!["image", "video"].includes(mediaType)) {
        return res
          .status(400)
          .json({ error: "Invalid media type. Allowed: images, video." });
      }

      // Collect uploaded media file paths
      const mediaFiles = req.files?.map((file) => file.path) || [];

      // Validate media file limits
      if (mediaType === "image" && mediaFiles.length > 5) {
        return res.status(400).json({ error: "Maximum 5 images allowed." });
      }

      if (mediaType === "video" && mediaFiles.length > 1) {
        return res.status(400).json({ error: "Only 1 video is allowed." });
      }

      console.log("Saving challenge with values:", {
        userId,
        name,
        phone,
        remark,
        mediaType,
        mediaFiles,
        challengeId,
        status: "Pending",
      });

      // Create challenge submission
      const challengeSubmission = await ChallengeSubmitForm.create({
        userId,
        name,
        phone,
        remark,
        mediaType,
        mediaFiles: mediaFiles.length > 0 ? JSON.stringify(mediaFiles) : null,
        challengeId,
        status: "Pending",
      });

      res.status(201).json({
        message: "Challenge submitted successfully",
        challengeSubmission,
      });
    });
  } catch (error) {
    console.error("Error submitting challenge:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

const getChallengeForm = async (req, res) => {
  try {
    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    console.log("Extracted Token:", token);

    // Verify token and get userId
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded Token:", decoded);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = decoded?.id; // Extract userId
    console.log("Extracted userId:", userId);
    if (!userId) {
      return res.status(400).json({ error: "Invalid token, userId missing" });
    }

    // Step 1: Find all challenges for this user
    const userChallenges = await ChallengeSubmitForm.findAll({
      where: { userId },
      attributes: ["challengeId", "isVerified"], // Get only challengeId
    });
    console.log("User Challenges:", userChallenges);

    if (!userChallenges.length) {
      return res
        .status(404)
        .json({ error: "No challenges found for this user", userChallenges });
    }

    const challengeIds = userChallenges.map(
      (challenge) => challenge.challengeId
    );
    console.log("Challenge IDs:", challengeIds);

    res.status(200).json(userChallenges);
  } catch (error) {
    console.error("Error fetching challenge forms:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

const getChallengeFormById = async (req, res) => {
  try {
    console.log("Received request to get challenge form");

    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Extracted Token:", token);

    if (!token) {
      console.error("Error: Token is missing");
      return res.status(403).json({ error: "Token is required" });
    }

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.error("Error: Invalid or expired token", err.message);
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      console.log("Decoded Token:", decoded);

      const LoggedUser = decoded?.id;
      console.log("Logged-in User ID:", LoggedUser);

      if (!LoggedUser) {
        console.error("Error: userId is missing in token");
        return res.status(400).json({ error: "Invalid token, userId missing" });
      }

      // Fetch submitted challenge form for the logged-in user
      const challengeForm = await ChallengeSubmitForm.findOne({
        where: { userId: LoggedUser },
      });

      console.log("Fetched Challenge Form:", challengeForm);

      if (!challengeForm) {
        console.error("Error: No challenge found for user", LoggedUser);
        return res
          .status(404)
          .json({ error: "Challenge not found for this user" });
      }

      // Fetch the challenge name separately
      const challenge = await Challenges.findOne({
        where: { id: challengeForm.challengeId },
        attributes: ["name"],
      });

      console.log("Fetched Challenge:", challenge);

      res.status(200).json({
        ...challengeForm.dataValues,
        challengeName: challenge ? challenge.name : null, // Add challenge name to response
      });
    });
  } catch (error) {
    console.error("Server error:", error.message);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

const updateChallengeForm = async (req, res) => {
  try {
    // Extract token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(403).json({ error: "Token is required" });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Debugging: Log the decoded token
      console.log("Decoded Token get user:", decoded);

      // Extract user ID from the decoded token
      const LoggedUser = decoded?.id;

      // Debugging: Check if userId exists
      if (!LoggedUser) {
        console.error("Error: userId is undefined in token");
        return res.status(400).json({ error: "Invalid token, userId missing" });
      }

      // Find the challenge form associated with the logged-in user
      const challenge = await ChallengeSubmitForm.findOne({
        where: { userId: LoggedUser },
      });

      if (!challenge) {
        return res
          .status(404)
          .json({ error: "Challenge not found for this user" });
      }

      // Determine upload path based on media type
      const uploadPath =
        req.body.mediaType === "images"
          ? "assets/images/challengesForm"
          : "assets/videos/challengesForm";

      uploadMedia(uploadPath).array("mediaFiles", 5)(req, res, async (err) => {
        if (err) {
          return res
            .status(400)
            .json({ error: `File upload error: ${err.message}` });
        }

        const { name, phone, remark, mediaType, isVerified } = req.body;

        if (mediaType && !["images", "video"].includes(mediaType)) {
          return res
            .status(400)
            .json({ error: "Invalid media type. Allowed: images, video" });
        }

        const mediaFiles = req.files
          ? req.files.map((file) => `${uploadPath}/${file.filename}`)
          : [];

        if (mediaType === "images" && mediaFiles.length > 5) {
          return res.status(400).json({ error: "Maximum 5 images allowed." });
        }

        if (mediaType === "video" && mediaFiles.length > 1) {
          return res.status(400).json({ error: "Only 1 video is allowed." });
        }

        // Update challenge details
        await challenge.update({
          name: name || challenge.name,
          phone: phone || challenge.phone,
          remark: remark || challenge.remark,
          mediaType: mediaType || challenge.mediaType,
          mediaFiles:
            mediaFiles.length > 0
              ? JSON.stringify(mediaFiles)
              : challenge.mediaFiles,
        });

        res.status(200).json({
          message: "Challenge updated successfully",
          challenge,
        });
      });
    });
  } catch (error) {
    console.error("Error updating challenge:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

const deleteChallengeForm = async (req, res) => {
  try {
    // Extract token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(403).json({ error: "Token is required" });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Extract user ID from the decoded token
      const LoggedUser = decoded.userId;

      // Find the challenge form associated with the logged-in user
      const challenge = await ChallengeSubmitForm.findOne({
        where: { userId: LoggedUser },
      });

      if (!challenge) {
        return res
          .status(404)
          .json({ error: "Challenge not found for this user" });
      }

      // Delete the challenge
      await challenge.destroy();
      res.status(200).json({ message: "Challenge deleted successfully" });
    });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

//{userInvoices}
const getUserInvoices = async (req, res) => {
  try {
    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1]; // "Bearer <token>"
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id; // Extract userId from token

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: User ID not found in token" });
    }

    // Define the invoices directory path
    const invoicesDir = path.join(__dirname, "../invoices");
    console.log("Invoices Directory Path:", invoicesDir);

    // Ensure the directory exists
    if (!fs.existsSync(invoicesDir)) {
      console.error("Invoices directory does not exist!");
      return res.status(404).json({ error: "No invoices found" });
    }

    // Read all files in the invoices directory
    const files = fs.readdirSync(invoicesDir);
    console.log("Files in Invoices Folder:", files);

    // Filter invoices for the user
    const userInvoices = files
      .filter(
        (file) => file.startsWith(`invoice-${userId}-`) && file.endsWith(".pdf")
      ) // Ensure correct filename pattern
      .map((file) => `/invoices/${file}`); // Convert to accessible paths

    console.log("Filtered User Invoices:", userInvoices);

    res.status(200).json({ invoices: userInvoices });
  } catch (error) {
    console.error("Error fetching user invoices:", error);
    res.status(500).json({ error: "Failed to retrieve invoices" });
  }
};

const getPayments = async (req, res) => {
  try {
    // Extract token from headers
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Decode userId from token
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded?.id;
    } catch (error) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    // Find payments for the user
    const payments = await Payment.findAll({ where: { userId } });

    if (!payments.length) {
      return res.status(404).json({ error: "No payments found" });
    }

    // Define the invoices directory path
    const invoicesDir = path.join(__dirname, "../invoices");

    // Ensure the directory exists
    if (!fs.existsSync(invoicesDir)) {
      console.error("Invoices directory does not exist!");
      return res.status(404).json({ error: "No invoices found" });
    }

    // Read all invoice files
    const files = fs.readdirSync(invoicesDir);

    // Attach invoice URLs for each payment based on `orderId`
    const paymentsWithInvoices = payments.map((payment) => {
      const invoiceFile = files.find((file) =>
        file.startsWith(`invoice-${payment.userId}-${payment.orderId}`)
      );

      return {
        ...payment.toJSON(), // Convert Sequelize object to plain JSON
        invoiceUrl: invoiceFile ? `/invoices/${invoiceFile}` : null, // Attach invoice URL directly
      };
    });

    return res.status(200).json({ payments: paymentsWithInvoices });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getUserdetailsById, //{user}
  updateUser,
  getWeeksByDoctor, //{weeks}
  getChallengesByDoctor, //{challenges}
  getAllProducts, //{products}
  getAllRewards, //{rewards}
  redeemReward, //{redeem}
  getUserRedeemedRewards,
  submitChallengeForm, //{challengeform}
  getChallengeForm,
  getChallengeFormById,
  updateChallengeForm,
  deleteChallengeForm,
  getUserInvoices, //{userInvoices}
  getPayments,
};
