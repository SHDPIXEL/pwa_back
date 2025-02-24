const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authenticateUser = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const token = req.header("Authorization")?.replace("Bearer ", "").trim();
    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.SECRET_KEY); // Ensure consistency with your login system

    // Find the user in the database
    const user = await User.findOne({ where: { id: decoded.id } });
    if (!user) {
      return res.status(403).json({ error: "Access denied. User not found." });
    }

    // Attach user info to the request object
    req.user = {
      id: user.id,
      userType: user.userType, // Consistent with your authentication logic
    };

    next(); // Proceed to the next middleware or route
  } catch (err) {
    return res
      .status(401)
      .json({ error: "Invalid or expired token.", details: err.message });
  }
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    req.user = decoded; // Attach decoded data to req.user
    next();
  });
};

module.exports = { authenticateUser, verifyToken };
