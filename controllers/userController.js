const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Week = require("../models/weeks");
const Challenges = require("../models/challenges");
const Products = require("../models/products");

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

    // Fetch all challenges associated with weeks assigned to this doctor
      const challenges = await Challenges.findAll({
        include: [{ model: Week, as: "week", where: { userId } }],
      });

    if (!challenges.length) {
      return res
        .status(404)
        .json({ error: "No challenges found for this doctor" });
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

module.exports = {
  getUserdetailsById,
  getWeeksByDoctor,
  getChallengesByDoctor,
  getAllProducts,
};
