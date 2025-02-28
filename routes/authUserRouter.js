const express = require("express");
const bodyParser = require("body-parser");
const {
  registerUser,
  loginUser,
  generatePaymentHash,
  handleSuccess,
  handleFailure
} = require("../controllers/authControlleruser");
const { verifyToken } = require("../middleware/userMiddleware");

const router = express.Router();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/hash", urlencodedParser, async (req, res) => {
  try {
    const { txnid, amount, productinfo, firstname, email, phone,quantity } = req.body;

    // Generate hash using the utility function
    const hash = generatePaymentHash(
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      quantity
    );

    res.send({ hash });
  } catch (error) {
    console.error("Error generating payment hash:", error.message);
    res.status(400).send({ error: error.message });
  }
});

// Define Routes
router.post("/success", handleSuccess);
router.post("/failure", handleFailure);

// Example of a protected route
router.get("/protected-route", verifyToken, (req, res) => {
  res.status(200).json({ message: "Access granted", user: req.user });
});

module.exports = router;
