const Week = require("../models/weeks");
const Challenges = require("../models/challenges");
const Products = require("../models/products");
const Rewards = require("../models/rewards");
const User = require("../models/user");
const uploadImage = require("../middleware/uploadMiddleware");

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
    // Check if only the status is being updated
    if (req.body.status && Object.keys(req.body).length === 1) {
      const challenge = await Challenges.findByPk(req.params.id);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }

      await challenge.update({ status: req.body.status });

      return res
        .status(200)
        .json({ message: "Status updated successfully", challenge });
    }

    // Handle file uploads if the request is updating more than just status
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

      // Find existing challenge
      const challenge = await Challenges.findByPk(req.params.id);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }

      // Preserve existing descriptions if not updated
      let updatedDescriptions = challenge.descriptions;
      if (descriptions) {
        try {
          const parsedDescriptions = JSON.parse(descriptions);
          if (Array.isArray(parsedDescriptions)) {
            updatedDescriptions = parsedDescriptions;
          }
        } catch (error) {
          return res.status(400).json({ error: "Invalid descriptions format" });
        }
      }

      // Retrieve existing images
      let existingImages = [];
      try {
        existingImages = challenge.challenge_images
          ? JSON.parse(challenge.challenge_images)
          : [];
      } catch (error) {
        return res.status(500).json({ error: "Invalid existing image format" });
      }

      // Ensure existingImages has at least 3 slots
      existingImages = [
        existingImages[0] || null,
        existingImages[1] || null,
        existingImages[2] || null,
      ];

      // Update only the images that have been provided
      const updatedImages = [
        req.files?.["challenge_image1"]
          ? `assets/images/challenges/${req.files["challenge_image1"][0].filename}`
          : existingImages[0],
        req.files?.["challenge_image2"]
          ? `assets/images/challenges/${req.files["challenge_image2"][0].filename}`
          : existingImages[1],
        req.files?.["challenge_image3"]
          ? `assets/images/challenges/${req.files["challenge_image3"][0].filename}`
          : existingImages[2],
      ];

      // Ensure images array doesn't contain `null`
      const finalImages = updatedImages.filter(Boolean);

      // Update Challenge
      await challenge.update({
        name: name || challenge.name,
        shortDescription: shortDescription || challenge.shortDescription,
        descriptions: updatedDescriptions,
        challenge_images: finalImages, // ✅ Ensure updated images are stored properly
        rewards: rewards || challenge.rewards,
        status: status || challenge.status,
        weekId: weekId || challenge.weekId,
      });

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

      const { name, description, oldPrice, newPrice, status, inStock } =
        req.body;
      const imagePath = req.file
        ? `assets/images/products/${req.file.filename}`
        : null;

      if (!name || !description || !newPrice || !status) {
        return res.status(400).json({
          error: "Name, description, new price, and status are required",
        });
      }

      const isProductInStock =
        inStock !== undefined ? JSON.parse(inStock) : true;

      const product = await Products.create({
        name,
        description,
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        newPrice: parseFloat(newPrice),
        product_image:
        imagePath.length > 0 ? JSON.stringify(imagePath) : null,
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

      const { name, description, oldPrice, newPrice, status, inStock } = req.body;
      const product = await Products.findByPk(req.params.id);

      if (!product) return res.status(404).json({ error: "Product not found" });

      // Use the new uploaded image if available, otherwise keep the existing image
      const imageFile = req.file
        ? `assets/images/products/${req.file.filename}`
        : product.product_image;

      await product.update({
        name: name || product.name,
        description: description || product.description,
        oldPrice: oldPrice !== undefined ? parseFloat(oldPrice) : product.oldPrice,
        newPrice: newPrice !== undefined ? parseFloat(newPrice) : product.newPrice,
        product_image: imageFile,  // No need for JSON.stringify() if storing a single image
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
    const users = await User.findAll();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users." });
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
  getAllRewards,
  getRewardById,
  updateReward,
  deleteReward,
  getAllUsers,//{user}
};
