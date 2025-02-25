const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Week = require("../models/weeks");
const Challenges = require("../models/challenges");
const Products = require("../models/products");
const ChallengeSubmitForm = require("../models/challengesForm");
const uploadMedia = require("../middleware/uploadMiddleware");

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
      return res.status(404).json({ error: "No challenges found for this week" });
    }

    return res.status(200).json(challenges);
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

    // Extract user ID from the decoded token
    const userId = decoded.id;

    // Find the user in the database
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(403).json({ error: "Access denied. User not found." });
    }

    // Fetch all products (available to both Doctors and OtherUsers)
    const products = await Products.findAll();

    if (!products.length) {
      return res.status(404).json({ error: "No products found" });
    }

    return res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res
      .status(500)
      .json({ error: `Error fetching products: ${error.message}` });
  }
};

const submitChallengeForm = async (req, res) => {
  try {
    const uploadPath = req.body.mediaType === "images" 
      ? "assets/images/challengesForm" 
      : "assets/videos/challengesForm";

    uploadMedia(uploadPath).array("mediaFiles", 5)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      }

      const { name, phone, remark, mediaType } = req.body;
      
      if (!name || !phone || !mediaType) {
        return res.status(400).json({ error: "Name, phone, and media type are required" });
      }

      if (!["images", "video"].includes(mediaType)) {
        return res.status(400).json({ error: "Invalid media type. Allowed: images, video" });
      }

      const mediaFiles = req.files ? req.files.map(file => `${uploadPath}/${file.filename}`) : [];
      
      if (mediaType === "images" && mediaFiles.length > 5) {
        return res.status(400).json({ error: "Maximum 5 images allowed." });
      }

      if (mediaType === "video" && mediaFiles.length > 1) {
        return res.status(400).json({ error: "Only 1 video is allowed." });
      }

      const challengeSubmission = await ChallengeSubmitForm.create({
        name,
        phone,
        remark,
        mediaType,
        mediaFiles: mediaFiles.length > 0 ? JSON.stringify(mediaFiles) : null,
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
    const challenges = await ChallengeSubmitForm.findAll();
    res.status(200).json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

const getChallengeFormById = async (req, res) => {
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
      const challenge = await ChallengeSubmitForm.findAll ();

      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found for this user" });
      }

      res.status(200).json(challenge);
    });
  } catch (error) {
    console.error("Error fetching challenge by user ID:", error);
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

      // Extract user ID from the decoded token
      const LoggedUser = decoded.userId;

      // Find the challenge form associated with the logged-in user
      const challenge = await ChallengeSubmitForm.findOne({ where: { userId: LoggedUser } });

      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found for this user" });
      }

      // Determine upload path based on media type
      const uploadPath = req.body.mediaType === "images" 
        ? "assets/images/challengesForm" 
        : "assets/videos/challengesForm";

      uploadMedia(uploadPath).array("mediaFiles", 5)(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: `File upload error: ${err.message}` });
        }

        const { name, phone, remark, mediaType } = req.body;

        if (mediaType && !["images", "video"].includes(mediaType)) {
          return res.status(400).json({ error: "Invalid media type. Allowed: images, video" });
        }

        const mediaFiles = req.files ? req.files.map(file => `${uploadPath}/${file.filename}`) : [];

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
          mediaFiles: mediaFiles.length > 0 ? JSON.stringify(mediaFiles) : challenge.mediaFiles,
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
      const challenge = await ChallengeSubmitForm.findOne({ where: { userId: LoggedUser } });

      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found for this user" });
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

const paymentController = async (req, res) => {
  
}

module.exports = {
  getUserdetailsById,
  getWeeksByDoctor,
  getChallengesByDoctor,
  getAllProducts,
  submitChallengeForm,
  getChallengeForm,
  getChallengeFormById,
  updateChallengeForm,
  deleteChallengeForm
};
