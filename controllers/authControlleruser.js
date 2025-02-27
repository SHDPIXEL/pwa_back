const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Payment = require("../models/payment");
const CodeTracker = require("../models/randomCode");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
const axios = require("axios"); // Import axios
const jsSHA = require("jssha");


// Temporary in-memory OTP store
const otpStore = {};
const senderIds = ["CELAGE", "CELANX", "CELGNX"];

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail", // Change as per your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmailOTP = async (email, otp, name = "User", userType) => {
  try {
    if (!email) {
      throw new Error("Recipient email is missing or invalid.");
    }

    let prefixedName = name;
    if (name !== "User") {
      if (userType === "Doctor") {
        prefixedName = `Dr. ${name}`;
      } else if (userType === "OtherUser") {
        prefixedName = `Mr. ${name}`;
      }
    }

    const emailTemplate = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Your OTP Code</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style="margin: 0; font-family: 'Poppins', sans-serif; background: #ffffff; font-size: 14px;">
        <div style="max-width: 680px; margin: 0 auto; padding: 45px 30px 60px; background: linear-gradient(135deg, #f9e0c2, #f7941d); font-size: 14px; color: #434343;">
          <header>
            <table style="width: 100%;">
              <tbody>
                <tr>
                  <td>
                    <img alt="Breboot Logo" src="YOUR_SVG_URL_HERE" height="30px"/>
                  </td>
                  <td style="text-align: right;">
                    <span style="font-size: 16px; line-height: 30px; color: #ffffff;">${new Date().toDateString()}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </header>
          <main>
            <div style="margin: 0; margin-top: 70px; padding: 92px 30px 115px; background: #ffffff; border-radius: 30px; text-align: center; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);">
              <div style="width: 100%; max-width: 489px; margin: 0 auto;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 500; color: #1f1f1f;">Your OTP</h1>
                <p style="margin: 0; margin-top: 17px; font-size: 20px; font-weight: 500; color: #434343">Hey ${prefixedName},</p>
                <p style="margin: 0; margin-top: 17px; font-size:16px; font-weight: 500; letter-spacing: 0.56px; color: #434343">
                  Thank you for choosing <span style="font-weight: 600; color: #1f1f1f;">Breboot</span>. Use the following OTP to verify your Email.
                  This OTP is valid for <span style="font-weight: 600; color: #1f1f1f;">5 minutes</span>.
                  Please do not share this code with anyone.
                </p>
                <div style="display: flex; justify-content: center; align-items: center; margin-top: 60px;">
                  <p style="margin: 0; font-size: 40px; font-weight: 600; text-align: center; color: #f7941d; word-spacing: 12px;">
                    ${otp.split("").join(" ")}
                  </p>  
                </div>
              </div>
            </div>
          </main>
          <footer style="width: 100%; max-width: 490px; margin: 20px auto 0; margin-top: 70px; text-align: center; border-top: 1px solid #e6ebf1;">
            <p style="margin: 0; margin-top: 40px; font-size: 16px; font-weight: 600; color: #434343;">
              <img alt="Breboot Logo" src="YOUR_SVG_URL_HERE" height="30px"/>
            </p>
            <p style="margin: 0; margin-top: 16px; color: #434343;">&copy; ${new Date().getFullYear()} Breboot. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>`;

    console.log(`Sending OTP email to: ${email}`);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      html: emailTemplate,
    });

    console.log(`OTP successfully sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
  }
};

// Send OTP via SMS
async function sendOtpViaSms(phone, otp) {
  const senderId = senderIds[Math.floor(Math.random() * senderIds.length)];
  const message = `Your OTP for Mobile verification is ${otp} use this Code to validate your verification. CELGNX`;

  const apiUrl =
    process.env.OTP_BASE_SEND +
    `?username=celagenx&password=celagenx&senderid=${senderId}&message=${encodeURIComponent(
      message
    )}&numbers=${phone}`;

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

const generateCode = async () => {
  try {
    let tracker = await CodeTracker.findOne();

    if (!tracker) {
      tracker = await CodeTracker.create({ latestNumber: 100 }); // Start from 100
    }

    tracker.latestNumber += 1;
    await tracker.save();

    return `BYZ${tracker.latestNumber}`;
  } catch (error) {
    console.error("Error generating code:", error);
    throw new Error("Failed to generate code");
  }
};

// Function to generate OTP (6-digit numeric)
const generateOTP = () => {
  return otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

const normalizeKey = (key) => key.trim().toLowerCase();

// Function to store OTP with expiration
const storeOTP = (key, otp) => {
  key = normalizeKey(key);
  otpStore[key] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // Expires in 5 minutes

  console.log(`OTP stored for ${key}:`, otpStore[key]); // Debugging

  // Auto-delete OTP after expiration
  setTimeout(() => {
    console.log(`Deleting OTP for ${key} due to expiration.`);
    delete otpStore[key];
  }, 5 * 60 * 1000);
};

// Function to retrieve and validate OTP
const validateOTP = (key, otp) => {
  key = normalizeKey(key);
  console.log(`Validating OTP for ${key}. Current OTP store:`, otpStore);

  const otpData = otpStore[key];

  if (!otpData) {
    console.log(`OTP for ${key} not found in store.`);
    return { valid: false, message: "OTP expired. Request a new OTP." };
  }

  // Check expiration time
  if (Date.now() > otpData.expiresAt) {
    console.log(`OTP for ${key} has expired.`);
    delete otpStore[key];
    return { valid: false, message: "OTP expired. Request a new OTP." };
  }

  if (otpData.otp !== otp) {
    console.log(
      `Entered OTP (${otp}) does not match stored OTP (${otpData.otp}) for ${key}.`
    );
    return { valid: false, message: "Invalid OTP." };
  }

  console.log(`OTP for ${key} is valid. Verification successful.`);
  delete otpStore[key]; // Remove OTP after successful verification
  return { valid: true };
};

// User Registration Controller (With OTP for phone)
const registerUser = async (req, res) => {
  try {
    console.log("Received registration request with data:", req.body);

    const {
      name,
      phone,
      email,
      gender,
      status,
      userType,
      state,
      password,
      otp,
    } = req.body;

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

      try {
        await sendEmailOTP(email, generatedOTP, name ,userType);
        return res.status(200).json({ message: "OTP sent to email", email });
      } catch (error) {
        console.error("Error sending OTP via email:", error);
        return res
          .status(500)
          .json({ message: "Failed to send OTP via email" });
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

    // Set initial points before use
    let initialPoints = null;

    if (userType === "Doctor") {
      userCode = (await generateCode())?.toString(); // ✅ Fix: Ensure a string
      console.log(`Generated code for Doctor: ${userCode}`);
      initialPoints = 500; // Doctors get 500 points
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
      initialPoints = 50; // Assign 50 reward points to OtherUser
    } else if (userType === "OtherUser" && !code) {
      console.log("Validation failed: No code provided for regular user.");
      return res
        .status(400)
        .json({ message: "Code is required for OtherUsers" });
    }

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
      state,
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
          return res
            .status(500)
            .json({ message: "Failed to send OTP via SMS" });
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

const generatePaymentHash = (txnid, amount, productinfo, firstname, email) => {
  if (!txnid || !amount || !productinfo || !firstname || !email) {
    throw new Error("Mandatory fields missing");
  }

  const hashString = `${process.env.PAYU_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}||||||||||${process.env.PAYU_SALT}`;
  const sha = new jsSHA("SHA-512", "TEXT");
  sha.update(hashString);
  return sha.getHash("HEX");
};

// Function to process payment
const processPayment = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    const { txnid, amount, productinfo, firstname, email, phone, surl, furl } =
      req.body;

    // Check for missing fields
    if (!txnid || !amount || !productinfo || !firstname || !email) {
      return res.status(400).json({ error: "Mandatory fields missing" });
    }

    // Generate hash correctly
    const hash = generatePaymentHash(
      txnid,
      amount,
      productinfo,
      firstname,
      email
    );

    // Return HTML form for PayU redirect (PayU expects a form submission)
    const payuForm = `
       <form id="payuForm" action="${process.env.PAYU_API_URL}" method="POST">
         <input type="hidden" name="key" value="${process.env.PAYU_KEY}" />
         <input type="hidden" name="txnid" value="${txnid}" />
         <input type="hidden" name="amount" value="${amount}" />
         <input type="hidden" name="productinfo" value="${productinfo}" />
         <input type="hidden" name="firstname" value="${firstname}" />
         <input type="hidden" name="email" value="${email}" />
         <input type="hidden" name="phone" value="${phone || ""}" />
         <input type="hidden" name="surl" value="${surl}" />
         <input type="hidden" name="furl" value="${furl}" />
         <input type="hidden" name="hash" value="${hash}" />
         <input type="hidden" name="service_provider" value="payu_paisa" />
       </form>
       <script>document.getElementById("payuForm").submit();</script>
     `;

    res.send(payuForm);
  } catch (err) {
    console.error("Error in processing payment:", err);
    res.status(500).json({ error: "Error processing payment" });
  }
};

// Function to handle payment verification and save in DB
const verifyPayment = async (req, res) => {
  try {
    // Extract the token from headers
    const token = req.headers.authorization?.split(" ")[1]; // Assuming "Bearer <token>"
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure JWT_SECRET is set in your environment variables
    const userId = decoded.userId; // Extract userId from the token

    // Extract payment details from request body
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      status,
      mihpayid,
      hash,
    } = req.body;

    // Validate PayU hash
    const reverseHashString = `${process.env.PAYU_SALT}|${status}||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${process.env.PAYU_KEY}`;
    const sha = new jsSHA("SHA-512", "TEXT");
    sha.update(reverseHashString);
    const expectedHash = sha.getHash("HEX");

    if (expectedHash !== hash) {
      console.error("Invalid hash from PayU");
      return res.status(400).json({ error: "Invalid hash" });
    }

    if (status === "success") {
      await Payment.create({
        userId, // Associate payment with user
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        payuId: mihpayid, // Store PayU transaction ID
        status: "completed",
      });

      // return res.send({
      //   status: "success",
      //   transaction_id: `Your transaction ID is: ${txnid}. Kindly save it for any further queries.`,
      //   message:
      //     "Congratulations! You'll receive an acknowledgment email shortly.",
      // });      // Redirect to frontend ThankYouPage
      res.redirect("http://localhost:3000/thankyou"); // Adjust to your frontend URL
    } else {
      await Payment.create({
        userId, // Associate payment with user
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        payuId: mihpayid, // Store PayU transaction ID
        status: "failed",
      });
      // Redirect to home page
      res.redirect("http://localhost:3000/"); // Adjust to your frontend URL
      // return res.send({
      //   status: "failed",
      //   message: "Payment is not successful",
      // });
    }
  } catch (err) {
    console.error("Error in verifying payment:", err);
    return res.status(500).send("Error in verifying payment");
  }
};

// // Verify Payment and Redirect
// const verifyPayment = async (req, res) => {
//   try {
//     const { txnid, amount, productinfo, firstname, email, status, mihpayid, hash } = req.body;

//     // Validate PayU hash
//     const reverseHashString = ${process.env.SALT}|${status}||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${process.env.KEY};
//     const sha = new jsSHA("SHA-512", "TEXT");
//     sha.update(reverseHashString);
//     const expectedHash = sha.getHash("HEX");

//     if (expectedHash !== hash) {
//       console.error("Invalid hash from PayU");
//       return res.status(400).json({ error: "Invalid hash" });
//     }

//     // Assuming userId is optional or fetched from your DB if needed
//     const userId = "some-user-id"; // Replace with actual logic if required

//     if (status === "success") {
//       await Payment.create({
//         userId,
//         txnid,
//         amount,
//         productinfo,
//         firstname,
//         email,
//         payuId: mihpayid,
//         status: "completed",
//       });
//       // Redirect to frontend ThankYouPage
//       res.redirect("http://localhost:3000/thankyou"); // Adjust to your frontend URL
//     } else {
//       await Payment.create({
//         userId,
//         txnid,
//         amount,
//         productinfo,
//         firstname,
//         email,
//         payuId: mihpayid,
//         status: "failed",
//       });
//       // Redirect to home page
//       res.redirect("http://localhost:3000/"); // Adjust to your frontend URL
//     }
//   } catch (err) {
//     console.error("Error in verifying payment:", err);
//     res.status(500).redirect("http://localhost:3000/"); // Redirect on error
//   }
// };

module.exports = {
  registerUser,
  loginUser,
  verifyUserToken,
  generatePaymentHash,
  processPayment,
  verifyPayment,
};
