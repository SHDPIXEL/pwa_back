const express = require("express");
const bodyParser = require("body-parser");
const {
  registerUser,
  loginUser,
  createOrder,
  createPayment
} = require("../controllers/authControlleruser");
const { verifyToken } = require("../middleware/userMiddleware");
const upload = require("../middleware/uploadMiddleware")

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/order",createOrder);
router.post("/payment",createPayment)

// Example of a protected route
router.get("/protected-route", verifyToken, (req, res) => {
  res.status(200).json({ message: "Access granted", user: req.user });
});

module.exports = router;
