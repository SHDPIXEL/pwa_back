const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Payment = require("../models/payment");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
const axios = require("axios"); // Import axios

// Temporary in-memory OTP store
const otpStore = {};
const senderIds = ["CELAGE"];

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

// Send OTP via SMS
async function sendOtpViaSms(phone, otp) {
  const senderId = senderIds[Math.floor(Math.random() * senderIds.length)];
  const message = `Your OTP for Mobile verification is ${otp} use this Code to validate your verification. CELGNX`;

  const apiUrl =
    process.env.OTP_BASE_SEND +
    `?username=celagenx&password=celagenx&senderid=${senderId}&message=${encodeURIComponent(message)}&numbers=${phone}`;

  console.log(process.env.OTP_BASE_SEND); 
  try {
    const response = await axios.get(apiUrl);
    if (response.status === 200) {
      console.log(`OTP ${otp} sent to ${phone} via senderId ${senderId}`);
      return "OTP sent successfully";
    } else {
      console.error("Error sending OTP:", response.data);
      throw new Error("Failed to send OTP");
    }
  } catch (error) {
    console.error("Error during API request to InsignSMS:", error);
    throw new Error("Failed to send OTP");
  }
}

let currentNumber = 101; // Start from 101

const generateCode = () => {
  const code = `BYZ${currentNumber}`;
  currentNumber++; // Increment for the next code
  return code;
};

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

// User Registration Controller (With OTP for phone)
const registerUser = async (req, res) => {
  try {
    console.log("Received registration request with data:", req.body);

    const { name, phone, email, gender, status, userType, password, otp } =
      req.body;

    let { code } = req.body;

    // Ensure at least one of phone or email is provided
    if (!phone && !email) {
      console.log("Validation failed: Neither phone nor email provided.");
      return res
        .status(400)
        .json({ message: "Either phone or email is required" });
    }

    // **Check if user already exists by email or phone**
    const existingUser = await User.findOne({
      where: email
        ? { email } // If email is provided, check only email
        : { phone }, // If phone is provided, check only phone
    });

    if (existingUser) {
      console.log(
        `User already exists with ${email ? "email" : "phone"}: ${
          email || phone
        }`
      );
      return res.status(400).json({
        message: `User already exists with this ${email ? "email" : "phone"}.`,
      });
    }

    // Validate phone number (must be exactly 10 digits & cannot start with 0)
    const phoneRegex = /^[1-9][0-9]{9}$/; // Starts with 1-9, followed by 9 digits
    if (phone && !phoneRegex.test(phone)) {
      console.log(`Invalid phone number entered: ${phone}`);
      return res.status(400).json({
        message:
          "Invalid phone number. Must be 10 digits and cannot start with 0.",
      });
    }

    // Send OTP if it's not provided
    if (phone && !otp) {
      const generatedOTP = generateOTP();
      storeOTP(phone, generatedOTP);

      try {
        await sendOtpViaSms(phone, generatedOTP);
        return res.status(200).json({ message: "OTP sent to phone", phone });
      } catch (error) {
        return res.status(500).json({ message: "Failed to send OTP via SMS" });
      }
    }

    if (email && !otp) {
      const generatedOTP = generateOTP();
      storeOTP(email, generatedOTP);
      await sendEmailOTP(email, generatedOTP);
      return res.status(200).json({ message: "OTP sent to email", email });
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
      otpStatus = "success"; // Update status to success
    }

    if (email && otp) {
      const { valid, message } = validateOTP(email, otp);
      if (!valid) {
        console.log(`OTP verification failed for ${email}: ${message}`);
        return res.status(400).json({ message });
      }
      console.log(`OTP verified successfully for ${email}`);
      otpStatus = "success";
    }

    // Ensure required fields are not null after OTP verification
    if (!name || !gender || !userType) {
      console.log("Validation failed: Required user fields are missing.");
      return res.status(400).json({
        message: "Missing required user fields (name, gender, userType).",
      });
    }

    // Ensure password is provided for email-based registration
    if (email && (!password || password.trim() === "")) {
      console.log(
        "Validation failed: Password is required for email registration."
      );
      return res
        .status(400)
        .json({ message: "Password is required for email registration." });
    }

    if (code) {
      code = code.toUpperCase();
    }

    // Handle code based on userType
    let userCode = code;

    if (userType === "Doctor") {
      userCode = generateCode(); // Generate a random code for the doctor
      console.log(`Generated code for Doctor: ${userCode}`);
    } else if (userType !== "Doctor" && userType === "OtherUser" && code) {
      // Verify if the provided code belongs to a registered doctor
      const doctor = await User.findOne({
        where: { code, userType: "Doctor" },
      });

      if (!doctor) {
        console.log(
          `Invalid code entered by user: ${code}. No matching doctor found.`
        );
        return res
          .status(400)
          .json({ message: "Invalid code. No doctor found with this code." });
      }
      console.log(
        `Code verification passed. User linked to Doctor with code: ${code}`
      );
    } else if (userType === "OtherUser" && !code) {
      console.log("Validation failed: No code provided for regular user.");
      return res
        .status(400)
        .json({ message: "Code is required for OtherUsers" });
    }

    // Set initial points for doctors
    const initialPoints = userType === "Doctor" ? 500 : null; // Doctors start with 500 points

    // Hash password (if provided)
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    console.log("Password hashing completed.");

    // Create new user
    console.log("Creating new user...");
    const newUser = await User.create({
      name,
      phone,
      email,
      gender,
      status,
      userType,
      code: userCode,
      points: initialPoints,
      password: hashedPassword,
    });

    console.log("User created successfully:", newUser.dataValues);

    // Verify user actually exists in DB
    const checkUser = await User.findOne({ where: { id: newUser.id } });
    if (!checkUser) {
      console.log("User was not created in the database. Debug required!");
      return res.status(500).json({ message: "User creation failed" });
    }

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, userType: newUser.userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Registration successful. Sending response...");
    return res.status(201).json({
      message: "User registered successfully",
      status: otpStatus, // Send OTP status here
      token,
    });
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

      if (phone && !otp) {
        const generatedOTP = generateOTP();
        storeOTP(phone, generatedOTP);
  
        try {
          await sendOtpViaSms(phone, generatedOTP);
          return res.status(200).json({ message: "OTP sent to phone", phone });
        } catch (error) {
          return res.status(500).json({ message: "Failed to send OTP via SMS" });
        }
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

const paymentController = async (req, res) => {
  try {
    const { txnid, amount, productinfo, firstname, email } = req.body;

    const key = process.env.PAYU_KEY;
    const salt = process.env.PAYU_SALT;
    const surl = process.env.SUCCESS_URL;
    const furl = process.env.FAILURE_URL;
    const payu_url = process.env.PAYU_API_URL; // e.g., https://secure.payu.in/_payment

    if (!txnid || !amount || !productinfo || !firstname || !email) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Generate hash
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    // Store payment in DB with "pending" status
    const newPayment = new Payment({
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      status: "pending", // Initial status before payment completion
    });

    await newPayment.save();

    // Create payload
    const payuPayload = {
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      surl,
      furl,
      hash,
      service_provider: "payu_paisa",
    };

    return res.json({ payu_url, payuPayload });
  } catch (error) {
    console.error("Payment Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const successController = async (req, res) => {
  try {
    const { txnid, status } = req.body;

    // Verify the payment
    const payment = await Payment.findOne({ txnid });

    if (!payment) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Update payment status
    payment.status = status === "success" ? "completed" : "failed";
    await payment.save();

    res.json({ message: "Payment Successful", payment });
  } catch (error) {
    console.error("Success Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const failureController = async (req, res) => {
  try {
    const { txnid, status } = req.body;

    // Find the payment
    const payment = await Payment.findOne({ txnid });

    if (!payment) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Mark as failed
    payment.status = status === "failed" ? "failed" : "";
    await payment.save();

    res.json({ message: "Payment Failed", payment });
  } catch (error) {
    console.error("Failure Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyUserToken,
  paymentController,
  successController,
  failureController,
};
