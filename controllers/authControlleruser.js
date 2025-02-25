const jwt = require("jsonwebtoken");
const User = require("../models/user");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");

// Temporary in-memory OTP store
const otpStore = {};

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail", // Change as per your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmailOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
    });
    console.log(`OTP sent to email: ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
  }
};

let currentNumber = 101; // Start from 101

const generateCode = () => {
  const code = `BYZ${currentNumber}`; // Generate the code
  currentNumber++; // Increment for the next user
  return code;
};

// // Example usage:
// console.log(generateCode()); // BYZ101
// console.log(generateCode()); // BYZ102
// console.log(generateCode()); // BYZ103
// console.log(generateCode()); // BYZ103

// Function to generate OTP (6-digit numeric)
const generateOTP = () => {
  return otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

// Function to store OTP with expiration
const storeOTP = (key, otp) => {
  otpStore[key] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // Expires in 5 minutes

  // Auto-delete OTP after expiration
  setTimeout(() => {
    delete otpStore[key];
  }, 5 * 60 * 1000);
};

// Function to retrieve and validate OTP
const validateOTP = (key, otp) => {
  const otpData = otpStore[key];
  if (!otpData)
    return { valid: false, message: "OTP expired. Request a new OTP." };
  if (otpData.otp !== otp) return { valid: false, message: "Invalid OTP." };
  delete otpStore[key]; // Remove OTP after successful verification
  return { valid: true };
};

const verifiedUsers = new Map(); // Key: email/phone, Value: user details

// User Registration Controller (With OTP for phone)
const registerUser = async (req, res) => {
  try {
    console.log("Received registration request with data:", req.body);
    const { name, phone, email, gender, status, userType, password, otp } = req.body;
    let { code } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ message: "Either phone or email is required" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: email ? { email } : { phone } });
    if (existingUser) {
      return res.status(400).json({ message: `User already exists with this ${email ? "email" : "phone"}.` });
    }

    // Validate phone number
    const phoneRegex = /^[1-9][0-9]{9}$/;
    if (phone && !phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number. Must be 10 digits and cannot start with 0." });
    }

    // Generate and send OTP if not provided
    const identifier = email || phone;
    if (!otp && !password) { // Only send OTP if neither OTP nor password is provided
      const generatedOTP = generateOTP();
      storeOTP(identifier, generatedOTP);

      if (email) {
        await sendEmailOTP(email, generatedOTP);
        return res.status(200).json({ message: "OTP sent to email", email });
      } else if (phone) {
        await sendPhoneOTP(phone, generatedOTP);
        return res.status(200).json({ message: "OTP sent to phone", phone });
      }
    }

    // Verify OTP if provided
    if (otp) {
      const { valid, message } = validateOTP(identifier, otp);
      if (!valid) {
        return res.status(400).json({ message });
      }

      // Store verified user details temporarily
      verifiedUsers.set(identifier, { name, phone, email, gender, status, userType, code });

      return res.status(200).json({ message: "OTP verified successfully. Proceed to set your password." });
    }

    // Ensure password is provided only after OTP verification
    if (!password || password.trim() === "") {
      return res.status(400).json({ message: "Password is required after OTP verification." });
    }

    // Retrieve verified user data from memory
    const verifiedUser = verifiedUsers.get(identifier);
    if (!verifiedUser) {
      return res.status(400).json({ message: "No verified user found. Please verify OTP first." });
    }

    // Handle Doctor Code Logic
    let userCode = verifiedUser.code ? verifiedUser.code.toUpperCase() : null;
    if (verifiedUser.userType === "Doctor") {
      userCode = generateCode();
    } else if (verifiedUser.userType === "OtherUser" && userCode) {
      const doctor = await User.findOne({ where: { code: userCode, userType: "Doctor" } });
      if (!doctor) {
        return res.status(400).json({ message: "Invalid doctor code." });
      }
    } else if (verifiedUser.userType === "OtherUser" && !userCode) {
      return res.status(400).json({ message: "Doctor code is required for OtherUsers." });
    }

    // Hash Password & Create User
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      ...verifiedUser,
      code: userCode,
      password: hashedPassword,
      points: verifiedUser.userType === "Doctor" ? 500 : null,
    });

    verifiedUsers.delete(identifier); // Remove from memory

    // Generate Token
    const token = jwt.sign({ id: newUser.id, userType: newUser.userType }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.status(201).json({ message: "User registered successfully", token });

  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// User Login Controller (OTP for phone, Password for email)
const loginUser = async (req, res) => {
  try {
    console.log("Received login request with data:", req.body);
    const { phone, email, password, otp } = req.body;

    if (!phone && !email) {
      console.log("Validation failed: Neither phone nor email provided.");
      return res
        .status(400)
        .json({ message: "Either phone or email is required for login" });
    }

    let user;

    // **Find user in the database by phone or email**
    user = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone }],
      },
    });

    if (!user) {
      console.log(
        `User not registered with ${email ? "email" : "phone"}: ${
          email || phone
        }`
      );
      return res.status(404).json({
        message: `User is not registered with this ${
          email ? "email" : "phone"
        }.`,
      });
    }

    if (phone) {
      // Validate phone number
      const phoneRegex = /^[1-9][0-9]{9}$/;
      if (!phoneRegex.test(phone)) {
        console.log(`Invalid phone number entered: ${phone}`);
        return res.status(400).json({
          message:
            "Invalid phone number. Must be 10 digits and cannot start with 0.",
        });
      }

      // Generate OTP if it's not provided
      if (phone && !otp) {
        const generatedOTP = generateOTP();
        storeOTP(phone, generatedOTP);
        console.log(`Generated OTP for ${phone}: ${generatedOTP}`);
        return res.status(200).json({ message: "OTP sent to phone", phone });
      }

      let otpStatus = "not verified"; // Default status

      // Verify OTP
      if (phone && otp) {
        const { valid, message } = validateOTP(phone, otp);
        if (!valid) {
          console.log(`OTP verification failed for ${phone}: ${message}`);
          return res.status(400).json({ message });
        }
        console.log(`OTP verified successfully for ${phone}`);
        otpStatus = "success";
      }

      // Find user by phone
      user = await User.findOne({ where: { phone } });
    } else if (email) {
      // Find user by email
      user = await User.findOne({ where: { email } });

      if (!user) {
        console.log("User not found with provided email.");
        return res.status(404).json({ message: "User not found" });
      }

      // Validate password
      if (!password || password.trim() === "") {
        console.log("Validation failed: Password is required for email login.");
        return res
          .status(400)
          .json({ message: "Password is required for email login." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log("Invalid password entered.");
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    if (!user) {
      console.log("User not found in database.");
      return res.status(404).json({ message: "User not found" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Login successful. Sending response...");
    return res
      .status(200)
      .json({ message: "Login successful", token, userType: user.userType });
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

async function verifyUserToken(req, res, next) {
  try {
    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1]; // Assuming format: "Bearer <token>"
    console.log("Token received:", token);

    if (!token) {
      return res.status(403).json({ message: "Token is required" });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Extract user ID from the decoded token
      const userId = decoded.id;
      console.log("Decoded token:", decoded);

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      req.user = user; // Attach user details to request
      next();
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { registerUser, loginUser, verifyUserToken };
