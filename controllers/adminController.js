const Week = require("../models/weeks");
const Challenges = require("../models/challenges");
const Products = require("../models/products");
const Rewards = require("../models/rewards");
const User = require("../models/user");
const ChallengeSubmitForm = require("../models/challengesForm");
const Redeem = require("../models/redeem");
const Payment = require("../models/payment");
const uploadImage = require("../middleware/uploadMiddleware");
const { Op } = require("sequelize");
const moment = require("moment")

//{week}
// **Create a New Week**
const createWeek = async (req, res) => {
  try {
    const { name, status } = req.body;

    // Validate input
    if (!name || !status) {
      return res.status(400).json({ error: "Name and status are required" });
    }

    const newWeek = await Week.create({ name, status });
    res
      .status(201)
      .json({ message: "Week created successfully", week: newWeek });
  } catch (error) {
    console.error("Error creating week:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// **Get All Weeks**
const getAllWeeks = async (req, res) => {
  try {
    const weeks = await Week.findAll();
    res.status(200).json(weeks);
  } catch (error) {
    console.error("Error fetching weeks:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// **Get a Single Week by ID**
const getWeekById = async (req, res) => {
  try {
    const { id } = req.params;
    const week = await Week.findByPk(id);

    if (!week) {
      return res.status(404).json({ error: "Week not found" });
    }

    res.status(200).json(week);
  } catch (error) {
    console.error("Error fetching week:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// **Update a Week by ID**
const updateWeek = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    // Find the week by ID
    const week = await Week.findByPk(id);
    if (!week) {
      return res.status(404).json({ error: "Week not found" });
    }

    // Update fields if provided
    week.name = name || week.name;
    week.status = status || week.status;

    await week.save();

    res.status(200).json({ message: "Week updated successfully", week });
  } catch (error) {
    console.error("Error updating week:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// **Delete a Week by ID**
const deleteWeek = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the week
    const deletedWeek = await Week.destroy({ where: { id } });

    if (!deletedWeek) {
      return res.status(404).json({ error: "Week not found" });
    }

    res.status(200).json({ message: "Week deleted successfully" });
  } catch (error) {
    console.error("Error deleting week:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//{challenges}
// Create a new challenge
const createChallenge = async (req, res) => {
  try {
    // Handle multiple file fields (3 images)
    uploadImage("challenges").fields([
      { name: "challenge_image1", maxCount: 1 },
      { name: "challenge_image2", maxCount: 1 },
      { name: "challenge_image3", maxCount: 1 },
    ])(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      const { name, shortDescription, descriptions, rewards, status, weekId } =
        req.body;

      // Convert descriptions into an array (JSON.parse if sent as stringified JSON)
      const descriptionsArray = descriptions ? JSON.parse(descriptions) : [];

      // Process uploaded images
      const imageFiles = [
        req.files["challenge_image1"]
          ? `assets/images/challenges/${req.files["challenge_image1"][0].filename}`
          : null,
        req.files["challenge_image2"]
          ? `assets/images/challenges/${req.files["challenge_image2"][0].filename}`
          : null,
        req.files["challenge_image3"]
          ? `assets/images/challenges/${req.files["challenge_image3"][0].filename}`
          : null,
      ].filter(Boolean); // Remove null values

      // Create a new challenge record
      const challenge = await Challenges.create({
        name,
        shortDescription,
        descriptions: descriptionsArray,
        challenge_images: JSON.stringify(imageFiles),
        rewards,
        status,
        weekId,
      });

      res
        .status(201)
        .json({ message: "Challenge created successfully", challenge });
    });
  } catch (error) {
    console.error("Error creating challenge:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Get all challenges
const getAllChallenges = async (req, res) => {
  try {
    const challenges = await Challenges.findAll({
      include: [{ model: Week, as: "week" }],
    });
    res.status(200).json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single challenge by ID
const getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenges.findByPk(req.params.id, {
      include: [{ model: Week, as: "week" }],
    });
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });
    res.status(200).json(challenge);
  } catch (error) {
    console.error("Error fetching challenge:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a challenge
const updateChallenge = async (req, res) => {
  try {
    console.log("Update Challenge API called");

    // Check if only the status is being updated
    if (req.body.status && Object.keys(req.body).length === 1) {
      console.log("Updating only status...");

      const challenge = await Challenges.findByPk(req.params.id);
      if (!challenge) {
        console.error("Challenge not found");
        return res.status(404).json({ error: "Challenge not found" });
      }

      await challenge.update({ status: req.body.status });

      return res
        .status(200)
        .json({ message: "Status updated successfully", challenge });
    }

    // Handle file uploads
    uploadImage("challenges").fields([
      { name: "challenge_image1", maxCount: 1 },
      { name: "challenge_image2", maxCount: 1 },
      { name: "challenge_image3", maxCount: 1 },
    ])(req, res, async (err) => {
      console.log("File upload middleware executed");

      if (err) {
        console.error("File upload error:", err);
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      console.log("Request Body:", req.body);
      console.log("Uploaded Files:", req.files);

      const { name, shortDescription, descriptions, rewards, status, weekId } =
        req.body;

      // Find existing challenge
      const challenge = await Challenges.findByPk(req.params.id);
      if (!challenge) {
        console.error("Challenge not found");
        return res.status(404).json({ error: "Challenge not found" });
      }
      console.log("Challenge found:", challenge);

      // Preserve existing descriptions if not updated
      let updatedDescriptions = challenge.descriptions;
      if (descriptions) {
        try {
          console.log("Raw descriptions:", descriptions);
          const parsedDescriptions = JSON.parse(descriptions);
          if (Array.isArray(parsedDescriptions)) {
            updatedDescriptions = parsedDescriptions;
          }
        } catch (error) {
          console.error("Invalid descriptions format:", error);
          return res.status(400).json({ error: "Invalid descriptions format" });
        }
      }

      // ✅ Retrieve and Parse Existing Images (Fix)
      let existingImages = [];
      try {
        existingImages =
          typeof challenge.challenge_images === "string"
            ? JSON.parse(challenge.challenge_images)
            : Array.isArray(challenge.challenge_images)
            ? challenge.challenge_images
            : [];
      } catch (error) {
        console.error("Invalid existing image format:", error);
        return res.status(500).json({ error: "Invalid existing image format" });
      }

      console.log("Existing Images (Parsed):", existingImages);

      // Ensure existingImages has at least 3 slots
      existingImages = [
        existingImages[0] || null,
        existingImages[1] || null,
        existingImages[2] || null,
      ];

      // ✅ Update Only the Provided Images (Fix)
      const updatedImages = [...existingImages];
      if (req.files?.["challenge_image1"]) {
        updatedImages[0] = `assets/images/challenges/${req.files["challenge_image1"][0].filename}`;
      }
      if (req.files?.["challenge_image2"]) {
        updatedImages[1] = `assets/images/challenges/${req.files["challenge_image2"][0].filename}`;
      }
      if (req.files?.["challenge_image3"]) {
        updatedImages[2] = `assets/images/challenges/${req.files["challenge_image3"][0].filename}`;
      }

      console.log("Final updated images:", updatedImages);

      // ✅ Update Challenge with Correct Image Array
      await challenge.update({
        name: name || challenge.name,
        shortDescription: shortDescription || challenge.shortDescription,
        descriptions: updatedDescriptions,
        challenge_images: JSON.stringify(updatedImages), // ✅ Store as JSON string
        rewards: rewards || challenge.rewards,
        status: status || challenge.status,
        weekId: weekId || challenge.weekId,
      });

      console.log("Challenge updated successfully");

      res
        .status(200)
        .json({ message: "Challenge updated successfully", challenge });
    });
  } catch (error) {
    console.error("Error updating challenge:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Delete a challenge
const deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenges.findByPk(req.params.id);
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });

    await challenge.destroy();
    res.status(200).json({ message: "Challenge deleted successfully" });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//{Product}
// Create a new product
const createProduct = async (req, res) => {
  try {
    uploadImage("products").single("product_image")(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      const { name, description, oldPrice, status, inStock } =
        req.body;
      const imagePath = req.file
        ? `assets/images/products/${req.file.filename}`
        : null;

      if (!name || !description || !oldPrice || !status) {
        return res.status(400).json({
          error: "Name, description, old Price, and status are required",
        });
      }

      const oldPriceValue = parseFloat(oldPrice);
      if (isNaN(oldPriceValue) || oldPriceValue <= 0) {
        return res.status(400).json({ error: "Invalid old price" });
      }

      // Automatically calculate new prices based on user type
      const priceForDoctor = oldPriceValue * 0.7; // 30% discount
      const priceForOtherUser = oldPriceValue * 0.8; // 20% discount

      const isProductInStock =
        inStock !== undefined ? JSON.parse(inStock) : true;

      const product = await Products.create({
        name,
        description,
        oldPrice: oldPriceValue,
        priceForDoctor: parseFloat(priceForDoctor.toFixed(2)), // Rounded to 2 decimal places
        priceForOtherUser: parseFloat(priceForOtherUser.toFixed(2)),
        product_image: imagePath.length > 0 ? JSON.stringify(imagePath) : null,
        status,
        inStock: isProductInStock,
      });

      // Determine the stock status message
      const stockMessage = isProductInStock
        ? "Product is in stock"
        : "Currently, product is out of stock";

      res.status(201).json({
        message: "Product created successfully",
        stockStatus: stockMessage,
        product,
      });
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Products.findAll();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    uploadImage("products").single("product_image")(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      const { name, description, oldPrice, newPrice, status, inStock } =
        req.body;
      const product = await Products.findByPk(req.params.id);

      if (!product) return res.status(404).json({ error: "Product not found" });

      // Use the new uploaded image if available, otherwise keep the existing image
      const imageFile = req.file
        ? `assets/images/products/${req.file.filename}`
        : product.product_image;

      await product.update({
        name: name || product.name,
        description: description || product.description,
        oldPrice:
          oldPrice !== undefined ? parseFloat(oldPrice) : product.oldPrice,
        newPrice:
          newPrice !== undefined ? parseFloat(newPrice) : product.newPrice,
        product_image: imageFile, // No need for JSON.stringify() if storing a single image
        status: status || product.status,
        inStock: inStock !== undefined ? JSON.parse(inStock) : product.inStock,
      });

      const stockMessage = product.inStock
        ? "Product is in stock"
        : "Currently, product is out of stock";

      res.status(200).json({
        message: "Product updated successfully",
        stockStatus: stockMessage,
        product,
      });
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    await product.destroy();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//{Rewards}
// Create a new reward
const createReward = async (req, res) => {
  try {
    uploadImage("rewards").single("reward_image")(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      const { name, description, points, status } = req.body;
      if (!name || !description || !points || !status) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const rewardImage = req.file
        ? `assets/images/rewards/${req.file.filename}`
        : null;

      const reward = await Rewards.create({
        name,
        description,
        points: parseInt(points),
        status,
        reward_image: rewardImage ? JSON.stringify([rewardImage]) : null,
      });

      res.status(201).json({ message: "Reward created successfully", reward });
    });
  } catch (error) {
    console.error("Error creating reward:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all rewards
const getAllRewards = async (req, res) => {
  try {
    const rewards = await Rewards.findAll();
    res.status(200).json({ rewards });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get reward by ID
const getRewardById = async (req, res) => {
  try {
    const reward = await Rewards.findByPk(req.params.id);
    if (!reward) return res.status(404).json({ error: "Reward not found" });
    res.status(200).json({ reward });
  } catch (error) {
    console.error("Error fetching reward:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update reward
const updateReward = async (req, res) => {
  try {
    uploadImage("rewards").single("reward_image")(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      const { name, description, points, status } = req.body;
      const reward = await Rewards.findByPk(req.params.id);
      if (!reward) return res.status(404).json({ error: "Reward not found" });

      const rewardImage = req.file
        ? `assets/images/rewards/${req.file.filename}`
        : reward.reward_image;

      await reward.update({
        name: name || reward.name,
        description: description || reward.description,
        points: points !== undefined ? parseInt(points) : reward.points,
        status: status || reward.status,
        reward_image: req.file
          ? JSON.stringify([rewardImage])
          : reward.reward_image,
      });

      res.status(200).json({ message: "Reward updated successfully", reward });
    });
  } catch (error) {
    console.error("Error updating reward:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete reward
const deleteReward = async (req, res) => {
  try {
    const reward = await Rewards.findByPk(req.params.id);
    if (!reward) return res.status(404).json({ error: "Reward not found" });
    await reward.destroy();
    res.status(200).json({ message: "Reward deleted successfully" });
  } catch (error) {
    console.error("Error deleting reward:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//{users}
//getAllUsers
const getAllUsers = async (req, res) => {
  try {
    // Fetch all users, excluding passwords for security
    const users = await User.findAll({
      attributes: { exclude: ["password"] }, // Exclude passwords from response
    });

    return res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//{ChallengeForm}
//getAllChallengeForm
const getAllChallengeForms = async (req, res) => {
  try {
    // Fetch all challenge submissions
    const allChallenges = await ChallengeSubmitForm.findAll({
      attributes: [
        "id",
        "name",
        "phone",
        "remark",
        "mediaType",
        "mediaFiles",
        "isVerified",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]], // Sort by latest submissions
    });

    if (!allChallenges.length) {
      return res.status(404).json({ error: "No challengeForm found" });
    }

    console.log("All Challenges:", allChallenges);

    res.status(200).json(allChallenges);
  } catch (error) {
    console.error("Error fetching all challenge forms:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

//updateChallengeForm
const updateChallengeForm = async (req, res) => {
  try {
    const uploadPath =
      req.body.mediaType === "images"
        ? "assets/images/challengesForm"
        : "assets/videos/challengesForm";

    uploadImage(uploadPath).array("mediaFiles", 5)(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      console.log("Request Body:", req.body);
      console.log("Uploaded Files:", req.files);

      const { id } = req.params;
      let { name, phone, remark, mediaType, isVerified } = req.body;

      // Find the existing challenge submission
      const challengeForm = await ChallengeSubmitForm.findByPk(id);
      if (!challengeForm) {
        return res
          .status(404)
          .json({ error: "Challenge submission not found" });
      }

      // Validate media type
      if (mediaType && !["images", "video"].includes(mediaType)) {
        return res
          .status(400)
          .json({ error: "Invalid media type. Allowed: images, video" });
      }

      let mediaFiles = challengeForm.mediaFiles
        ? JSON.parse(challengeForm.mediaFiles)
        : [];
      if (req.files && req.files.length > 0) {
        const newFiles = req.files.map(
          (file) => `${uploadPath}/${file.filename}`
        );
        mediaFiles = [...mediaFiles, ...newFiles];
      }

      if (mediaType === "images" && mediaFiles.length > 5) {
        return res.status(400).json({ error: "Maximum 5 images allowed." });
      }

      if (mediaType === "video" && mediaFiles.length > 1) {
        return res.status(400).json({ error: "Only 1 video is allowed." });
      }

      // Convert isVerified to an integer
      isVerified = parseInt(isVerified, 10);
      console.log("Parsed isVerified:", isVerified, typeof isVerified);

      // Handle challenge status update
      if (isVerified === 2) {
        challengeForm.status = "Rejected";
      } else if (isVerified === 1) {
        challengeForm.status = "Approved";

        // ✅ Fetch the related challenge to get reward points
        const challenge = await Challenges.findByPk(challengeForm.challengeId);
        if (!challenge || !challenge.rewards) {
          return res.status(400).json({ error: "Challenge rewards not found" });
        }

        const rewardPoints = parseInt(challenge.rewards, 10) || 0;

        // ✅ Fetch the user
        const user = await User.findByPk(challengeForm.userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // ✅ Update points only for Doctors
        if (user.userType === "Doctor") {
          user.points += rewardPoints;
          await user.save();
        }
      } else if (isVerified === 0) {
        challengeForm.status = "Pending";
      } else {
        console.warn("Invalid isVerified value received:", isVerified);
      }

      challengeForm.isVerified = isVerified;
      challengeForm.name = name || challengeForm.name;
      challengeForm.phone = phone || challengeForm.phone;
      challengeForm.remark = remark || challengeForm.remark;
      challengeForm.mediaType = mediaType || challengeForm.mediaType;
      challengeForm.mediaFiles =
        mediaFiles.length > 0
          ? JSON.stringify(mediaFiles)
          : challengeForm.mediaFiles;

      // Save updated challenge record
      await challengeForm.save();

      return res.status(200).json({
        message: "Challenge updated successfully",
        challengeForm,
      });
    });
  } catch (error) {
    console.error("Error updating challenge:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//{Redeem}
// Create a new redeem
const getAllRedeemedRewards = async (req, res) => {
  try {
    // Fetch all redeemed rewards with user and reward details
    const allRedeemedRewards = await Redeem.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"], // Fetch user details
        },
        {
          model: Rewards,
          as: "reward",
          attributes: ["id", "name", "points"], // Fetch reward details
        },
      ],
      attributes: ["id", "redeemedAt"], // Fetch redemption details
    });

    // Calculate total redemptions
    const totalRedemptions = allRedeemedRewards.length;

    return res.status(200).json({
      message: "All redeemed rewards fetched successfully.",
      totalRedemptions, // Count for the dashboard
      redeemedRewards: allRedeemedRewards, // List of all redemptions
    });
  } catch (error) {
    console.error("Error fetching all redeemed rewards:", error);
    return res.status(500).json({
      error: `Error fetching redeemed rewards: ${error.message}`,
    });
  }
};

//{redeemGraph}
const getRedeemedRewardsGraph = async (req, res) => {
  try {
    // Get the current date
    const today = moment().startOf("day");
    const sevenDaysAgo = moment(today).subtract(6, "days");

    console.log("Fetching redemptions from:", sevenDaysAgo.toDate(), "to", today.endOf("day").toDate());

    // Fetch redeemed rewards from the last 7 days, including today
    const redeemedRewards = await Redeem.findAll({
      where: {
        redeemedAt: {
          [Op.between]: [sevenDaysAgo.toDate(), today.endOf("day").toDate()],
        },
      },
      attributes: ["redeemedAt"], // Fetch only the redemption date
    });

    // Initialize an array with all the dates for the last 7 days
    const dateCounts = Array.from({ length: 7 }, (_, i) => {
      const date = moment(sevenDaysAgo).add(i, "days");
      return {
        date: date.format("YYYY-MM-DD"), // Format the date as a string
        redemptions: 0, // Initial redemption count is zero
      };
    });

    console.log("Redeemed rewards count:", redeemedRewards.length);

    // Count redemptions for each day
    redeemedRewards.forEach((reward) => {
      const redemptionDate = moment(reward.redeemedAt).format("YYYY-MM-DD");
      const dayEntry = dateCounts.find((entry) => entry.date === redemptionDate);
      if (dayEntry) {
        dayEntry.redemptions += 1; // Increment redemption count
      }
    });

    // Respond with the data
    res.status(200).json({
      message: "Redeemed rewards data for the last 7 days",
      data: dateCounts,
    });
  } catch (error) {
    console.error("Error fetching redeemed rewards graph data:", error.message, error.stack);
    res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

//{payments/SoldItems}
const getAllCompletedPayments = async (req, res) => {
  try {
    const completedPayments = await Payment.findAll({
      where: { status: "completed" }, // Fetch only completed payments
    });

    res.status(200).json(completedPayments);
  } catch (error) {
    console.error("Error fetching completed payments:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//{soldItemsGraph}
const getCompletedPaymentsGraph = async (req, res) => {
  try {
    // Get the current date
    const today = moment().startOf("day");
    const sevenDaysAgo = moment(today).subtract(6, "days");

    // Fetch completed payments from the last 7 days
    const completedPayments = await Payment.findAll({
      where: {
        status: "completed",
        createdAt: {
          [Op.between]: [sevenDaysAgo.toDate(), today.endOf("day").toDate()],
        },
      },
      attributes: ["createdAt"], // Only fetch createdAt for counting
    });

    // Initialize an array with all the dates for the last 7 days
    const dateCounts = Array.from({ length: 7 }, (_, i) => {
      const date = moment(sevenDaysAgo).add(i, "days");
      return {
        date: date.format("YYYY-MM-DD"), // Format the date as a string
        payments: 0, // Initial count is zero
      };
    });

    // Count payments for each day
    completedPayments.forEach((payment) => {
      const paymentDate = moment(payment.createdAt).format("YYYY-MM-DD");
      const dayEntry = dateCounts.find((entry) => entry.date === paymentDate);
      if (dayEntry) {
        dayEntry.payments += 1; // Increment count for that day
      }
    });

    // Respond with the graph data
    res.status(200).json({
      message: "Completed payments data for the last 7 days",
      data: dateCounts,
    });
  } catch (error) {
    console.error("Error fetching completed payments graph data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createWeek, //{weeks}
  getAllWeeks,
  getWeekById,
  updateWeek,
  deleteWeek,
  createChallenge, //{challenges}
  getAllChallenges,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
  createProduct, //{products}
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createReward, //{Rewards}
  getAllRedeemedRewards,//{redeem}
  getRedeemedRewardsGraph,
  getAllRewards,
  getRewardById,
  updateReward,
  deleteReward,
  getAllUsers, //{user}
  getAllChallengeForms, //{ChallengeForm}
  updateChallengeForm,
  getAllCompletedPayments,//{payments/SoldItems}
  getCompletedPaymentsGraph,
};
