const express = require("express");
const {
  registerUser,
  loginUser,
  paymentController,
  successController,
  failureController,
} = require("../controllers/authControlleruser");
const { verifyToken } = require("../middleware/userMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/pay",paymentController)
router.post("/success",successController)
router.post("/failure",failureController)

// Example of a protected route
router.get("/protected-route", verifyToken, (req, res) => {
  res.status(200).json({ message: "Access granted", user: req.user });
});

module.exports = router;
