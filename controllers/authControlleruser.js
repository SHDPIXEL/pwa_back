const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Payment = require("../models/payment");
const CodeTracker = require("../models/randomCode");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const axios = require("axios"); // Import axios
const jsSHA = require("jssha");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { v4: uuidv4 } = require("uuid");
const Orders = require("../models/order");
const Products = require("../models/products");
const moment = require("moment");
const upload = require("../middleware/uploadMiddleware");
const { sendMail } = require('../utils/mailer');

// Temporary in-memory OTP store
const otpStore = {};
const senderIds = ["CELAGE", "CELANX", "CELGNX"];

const generateInvoicePDF = async ({
  userId,
  name,
  quantity,
  phoneNumber,
  invoiceDate,
  invoiceTime,
  orderId,
  transactionId,
  amount,
  productinfo,
}) => {
  try {
    const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Modern Invoice</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            :root {
                --primary: #f7951f;
                --text-primary: #1f2937;
                --text-secondary: #6b7280;
                --background: #f9fafb;
                --card: #ffffff;
                --border: #e5e7eb;
            }

            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Inter', sans-serif;
                background: var(--background);
                display: flex;
                justify-content: center;
                color: var(--text-primary);
                padding: 2rem;
                line-height: 1.5;
            }

            .invoice-container {
                max-width: 800px;
                width: 100%;
                background: var(--card);
                padding: 2.5rem;
                border-radius: 12px;
                box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                /*padding-bottom: 1.5rem;*/
                /*border-bottom: 2px solid var(--border);*/
            }

            .logo-section img {
                height: 50px;
            }

            .info-container {
                display: flex;
                justify-content: space-between;
                margin-top: 1.5rem;
                padding-bottom: 1.5rem;
                border-bottom: 2px solid var(--border);
            }

            .supplier-info, .customer-info {
                flex: 1;
                font-size: 0.875rem;
            }

            .supplier-info p, .customer-info p {
                margin-bottom: 0.5rem;
            }

            .invoice-details-container {
                display: flex;
                justify-content: space-between;
                margin-top: 1.5rem;
                padding-bottom: 1.5rem;
                border-bottom: 2px solid var(--border);
                font-size: 0.875rem;
            }

            .table-container {
                margin: 2rem 0;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid var(--border);
            }

            .invoice-table {
                width: 100%;
                border-collapse: collapse;
            }

            .invoice-table th {
                background: var(--primary);
                color: white;
                font-weight: 500;
                padding: 1rem;
                text-transform: uppercase;
                font-size: 0.75rem;
            }

            .invoice-table td {
                padding: 1rem;
                border-bottom: 1px solid var(--border);
                font-size: 0.875rem;
                color: var(--text-secondary);
            }

            .total-section {
                margin-top: 2rem;
                padding-top: 1.5rem;
                border-top: 2px solid var(--border);
                text-align: right;
            }

            .total-row {
                display: flex;
                justify-content: flex-end;
                gap: 4rem;
                font-size: 0.875rem;
                color: var(--text-secondary);
            }

            .total-row.final {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--primary);
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header Section -->
            <div class="header">
                <div class="logo-section">
                    <img src="https://user.cholinationdrive.needsunleashed.com/assets/Logo-RadocjPK.png" alt="Breboot Logo">
                </div>
            </div>
            
            <!-- Tax Invoice Heading -->
            <div style="text-align: center; font-size: 1.2rem; font-weight: 700; margin-top: 0.2rem; color: var(--text-primary); padding-bottom: 1rem; border-bottom: 2px solid var(--border);">
                Tax Invoice
            </div>
            
            <!-- Supplier & Customer Info -->
            <div class="info-container" style="display: flex; justify-content: space-between; gap: 2rem;">
                <div class="supplier-info" style="flex: 1; text-align: left;">
                    <p><strong>Supplier Name:</strong> Celagenex Pvt. Ltd.</p>
                    <p><strong>Supplier Address:</strong> 123 Street, City, State, 456789</p>
                    <p><strong>GSTIN:</strong> 29AABCT3518Q1ZV</p>
                </div>
                <div class="customer-info" style="flex: 1; text-align: right;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Phone:</strong> ${phoneNumber}</p>
                    <p><strong>Address:</strong> ${customerAddress}</p>
                </div>
            </div>


            <!-- Invoice Details (Moved Below Supplier & Customer Info) -->
            <div class="invoice-details-container">
                <div class="left-details">
                    <p><strong>Invoice Date:</strong> ${invoiceDate} ${invoiceTime}</p>
                    <p><strong>Transaction ID:</strong> ${transactionId}</p>
                </div>
                <div class="right-details">
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Payment Method:</strong> UPI/DIGITAL </p>
                </div>
            </div>

            <!-- Product Table -->
            <div class="table-container">
                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Description</th>
                            <th>Price</th>
                            <th>Qty.</th>
                            <th>Tax</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>${productinfo}</td>
                            <td>₹${amount}</td>
                            <td>${quantity}</td>
                            <td>0%</td>
                            <td>₹${amount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Total Amount -->
            <div class="total-section" style="border-bottom: 2px solid var(--border); padding-bottom: 1rem;">
                <div class="total-row final">
                    <span style="font-size: 1.1rem;">Total Paid Amount:</span>
                    <span style="font-size: 1.1rem;">₹${amount}</span>
                </div>
                <div class="total-row" style="font-size: 0.9rem; color: var(--text-primary); font-weight: 500;">
                    <span>Total Amount in Words:</span>
                    <span>${amountInWords}</span>
                </div>
            </div>
            
            <!-- Additional Invoice Notes -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 2rem; border: 1px solid var(--border);">
                <tr>
                    <td style="width: 50%; padding: 8px; border-right: 1px solid var(--border); font-size: 0.875rem; color: var(--text-primary); vertical-align: bottom; text-align: left;">
                        <p>www.celagenex.com</p>
                    </td>
                    <td style="width: 50%; padding: 8px; font-size: 0.875rem; color: var(--text-primary); vertical-align: bottom; text-align: right;">
                        <p>E&OE</p>
                        <p style="margin-top: 2rem;">Authorized Signatory</p>
                        <p>Celagenex Pvt. Ltd.</p>
                    </td>
                </tr>
            </table>
        </div>
    </body>
    </html>
    `;

    // Create invoices directory if it doesn't exist
    const invoicesDir = path.join(__dirname, "../invoices");
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    // Use userId in the invoice file name
    const invoiceFileName = `invoice-${userId}-${orderId}.pdf`;
    const invoicePath = path.join(invoicesDir, invoiceFileName);

    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();

    // Set viewport to ensure proper rendering
    await page.setViewport({ width: 800, height: 1000 });

    await page.setContent(invoiceHtml, { waitUntil: "networkidle0" });

    // Generate PDF with defined margins to avoid excessive space
    await page.pdf({
      path: invoicePath,
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });

    await browser.close();

    return `/invoices/${invoiceFileName}`; // Path accessible by frontend
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    throw new Error("Invoice generation failed");
  }
};

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

const getWelcomeEmailContent = (doctorName, referralCode) => {
  return {
    text: `
Dear Dr. ${doctorName},
Welcome to Breboot App! 🎉 You’ve taken the first step towards a healthier lifestyle for yourself and your patients.
As a welcome gift, you’ve received 500 Breboot points and a referral code to share with your patients. Here’s how you can make the most of the app:

🌟 1. Breboot Challenge
Participate in weekly exercise & diet challenges by submitting your videos or photos. Earn reward points for every challenge you complete!

💎 2. Privilege Member Program
• Get 30% off on Byzepta purchases.
• Your patients can also get Byzepta @10% discount by registering in app and if they add your referral code (${referralCode}) they can avail additional 10% off.
• Earn 50 points for every referral or purchase.

🍽 3. 100 lucky drs. will get free Diet Consultation
You and your patients can avail a free 1 month diet plan from celebrity dietician Dr. Kiran Rukadikar and team.

📌 Important Note: There is no cancellation or refund policy on purchases.

Start exploring the app and begin earning rewards today! If you need any assistance, feel free to reach out to our support team at cheerfol2@celagenex.com.

Happy Rebooting! 🚀
The Breboot Team
    `,
    html: `
      <h2>Dear Dr. ${doctorName},</h2>
      <p>Welcome to <strong>Breboot App</strong>! 🎉 You’ve taken the first step towards a healthier lifestyle for yourself and your patients.</p>
      <p>As a welcome gift, you’ve received <strong>500 Breboot points</strong> and a referral code: <strong>${referralCode}</strong> to share with your patients.</p>
      <h3>Here’s how you can make the most of the app:</h3>
      <ul>
        <li><strong>🌟 Breboot Challenge:</strong> Participate in weekly exercise & diet challenges by submitting your videos or photos. Earn reward points for every challenge you complete!</li>
        <li><strong>💎 Privilege Member Program:</strong><br>
          • Get 30% off on Byzepta purchases.<br>
          • Your patients can also get Byzepta @10% discount by registering in app and if they add your referral code (<strong>${referralCode}</strong>) they can avail additional 10% off.<br>
          • Earn 50 points for every referral or purchase.</li>
        <li><strong>🍽 Free Diet Consultation:</strong> 100 lucky doctors will get free diet consultation. You and your patients can avail a free 1-month diet plan from celebrity dietician Dr. Kiran Rukadikar and team.</li>
      </ul>
      <p><strong>📌 Important Note:</strong> There is no cancellation or refund policy on purchases.</p>
      <p>Start exploring the app and begin earning rewards today! If you need assistance, reach out to our support team at <a href="mailto:cheerfol2@celagenex.com">cheerfol2@celagenex.com</a>.</p>
      <p><strong>Happy Rebooting! 🚀</strong><br>The Breboot Team</p>
    `,
  };
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


async function sendWelcomeSms(phone, name, referralCode) {
  const senderId = senderIds[Math.floor(Math.random() * senderIds.length)];
  // const message = `Welcome to Breboot App - B Ready to Reboot! Dear Dr.${name},Welcome! You've earned 500 Breboot points and a referral code. Join weekly challenges, enjoy discounts, earn rewards, and get a free diet plan. Register now! Breboot Team CELAGENEX.`;
  const message = `Welcome to Breboot App - B Ready to Reboot!
Dear Dr.${name},
Welcome! You've earned 500 Breboot points and a referral code. Join weekly challenges, enjoy discounts, earn rewards, and get free diet plan. Register now!
Breboot Team
CELAGENEX.`

  const apiUrl =
    process.env.OTP_BASE_SEND +
    `?username=celagenx&password=celagenx&senderid=${senderId}&message=${encodeURIComponent(
      message
    )}&numbers=${phone}`;

  try {
    const response = await axios.get(apiUrl);
    console.log("SMS API Response:", response.data); // Log full response data

    if (response.status === 200 && response.data.includes("Success")) {
      console.log(`Welcome SMS sent to Dr. ${name} at ${phone} via senderId ${senderId}`);
      return "Welcome SMS sent successfully";
    } else {
      console.error("Error sending Welcome SMS:", response.data);
      throw new Error("Failed to send Welcome SMS");
    }
  } catch (error) {
    console.error("Error during API request for Welcome SMS:", error);
    throw new Error("Failed to send Welcome SMS");
  }
}


const sendResetPasswordEmail = async ({ to, subject, text }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};

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

    const { name, phone, email, gender, status, userType, state, otp } = req.body;
    let { code } = req.body;

    // Ensure at least one of phone or email is provided
    if (!phone && !email) {
      console.log("Validation failed: Neither phone nor email provided.");
      return res
        .status(400)
        .json({ message: "Either phone or email is required" });
    }

    // Check if user already exists by email or phone
    const checkExistingUser = async (field, value) => {
      if (value) {
        const existingUser = await User.findOne({ where: { [field]: value } });
        if (existingUser) {
          console.log(`User already exists with ${field}: ${value}`);
          return true;
        }
      }
      return false;
    };

    if (await checkExistingUser("email", email)) {
      return res
        .status(400)
        .json({ message: "User already exists with this email." });
    }
    if (await checkExistingUser("phone", phone)) {
      return res
        .status(400)
        .json({ message: "User already exists with this phone." });
    }

    // Validate phone number (must be exactly 10 digits & cannot start with 0)
    const phoneRegex = /^[1-9][0-9]{9}$/;
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
        console.error("Failed to send OTP via SMS:", error);
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

    // Ensure required fields are not null after OTP verification
    if (!name || !gender || !userType) {
      console.log("Validation failed: Required user fields are missing.");
      return res.status(400).json({
        message: "Missing required user fields (name, gender, userType).",
      });
    }

    if (code) {
      code = code.toUpperCase();
    }

    // Handle code based on userType
    let userCode = code;
    let initialPoints = null;

    if (userType === "Doctor") {
      userCode = (await generateCode()).toString();
      console.log(`Generated code for Doctor: ${userCode}`);
      initialPoints = 500;
    } else if (userType === "OtherUser" && code) {
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
      initialPoints = 50;
    }

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
      password: "password not required",
    });

    console.log("User created successfully:", newUser.dataValues);

    // Verify user actually exists in DB
    const checkUser = await User.findOne({ where: { id: newUser.id } });
    if (!checkUser) {
      console.log("User was not created in the database. Debug required!");
      return res.status(500).json({ message: "User creation failed" });
    }

    // Send welcome email if the user is a Doctor
    if (userType === "Doctor" && email) {
      const emailSubject = "Welcome to Breboot App!";
      const { text, html } = getWelcomeEmailContent(name, userCode);
      console.log("Before sending mail to:", email);
      try {
        await sendMail(email, emailSubject, text, html);
        console.log(`Welcome email sent successfully to Dr. ${name} at ${email}`);
      } catch (emailError) {
        console.error(`Failed to send welcome email to ${email}:`, emailError);
      }
    }

    if (userType === "Doctor") {
      try {
        await sendWelcomeSms(phone, name, userCode);
        console.log(`Welcome SMS sent successfully to Dr. ${name} at ${phone}`);
      } catch (smsError) {
        console.error(`Failed to send Welcome SMS to ${phone}:`, smsError);
      }
    }

    // Generate token using JWT_SECRET from .env
    const token = jwt.sign(
      { id: newUser.id, userType: newUser.userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Registration successful. Sending response...");
    return res.status(201).json({
      message: "User registered successfully",
      status: otpStatus,
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
        `User not registered with ${email ? "email" : "phone"}: ${email || phone
        }`
      );
      return res.status(404).json({
        message: `User is not registered with this ${email ? "email" : "phone"
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await AppUser.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token in DB with expiry time
    user.resetPasswordToken = hashedToken;
    await user.save();

    // Set expiry time (15 minutes)
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // ISO format

    // Generate Reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}?expires=${expires}`;
    console.log("Reset URL:", resetUrl);

    await sendResetPasswordEmail({
      to: email,
      subject: "Exim India Password Reset",
      text: `Click the link to reset your password: ${resetUrl}`,
    });

    res.status(200).json({ message: "Password reset link sent to email" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    console.log("req data", req.body, req.params, req.query)
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;
    const expires = new Date(req.query.expires).getTime(); // Convert ISO to timestamp

    // Validate expiration
    if (!expires || Date.now() > expires) {
      return res.status(400).json({ message: "This link has expired. Please request a new one." });
    }

    if (!newPassword || !confirmNewPassword)
      return res.status(400).json({ message: "Both fields are required" });

    if (newPassword !== confirmNewPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    // Hash the token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with the hashed token
    const user = await AppUser.findOne({ resetPasswordToken: hashedToken });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear the reset token
    user.resetPasswordToken = null;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error" });
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

const createOrder = async (req, res) => {
  try {
    // Extract token from header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Verify and decode the token
    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded?.id;
    } catch (error) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Invalid or expired token" });
    }

    console.log("req", req.body);

    const { productId, quantity, amount } = req.body;

    // Validate input
    if (!productId || !quantity || !amount) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Fetch product details
    const product = await Products.findByPk(productId);
    if (!product || product.status !== "Active") {
      return res.status(404).json({ error: "Product not found or inactive." });
    }

    if (!product.inStock) {
      return res.status(400).json({ error: "Product is out of stock." });
    }

    // Generate unique orderId
    const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Get current date-time in DD-MM-YYYY hh:mm:ss AM/PM format
    const orderDate = moment().format("DD-MM-YYYY hh:mm:ss A");

    // Create order
    const order = await Orders.create({
      orderId,
      userId,
      productId,
      quantity,
      amount,
      orderDate,
    });

    return res.status(201).json({
      message: "Order created successfully!",
      order,
      orderId: order.orderId,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createPayment = async (req, res) => {
  try {
    // Use Multer middleware for file upload
    upload("payments").single("paymentScreenshot")(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      // Extract token from header
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No token provided" });
      }

      let userId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded?.id;
      } catch (error) {
        return res
          .status(401)
          .json({ error: "Unauthorized: Invalid or expired token" });
      }

      console.log("Request body:", req.body);
      console.log("Uploaded file:", req.file);

      const { transactionId, orderId, name, image, address } = req.body;

      // Validate input
      if (!transactionId || !orderId || !req.file || !name || !image) {
        return res.status(400).json({
          error: "Transaction ID, Order ID, and image are required.",
        });
      }

      // Check if order exists and belongs to the user
      const order = await Orders.findOne({ where: { orderId, userId } });
      if (!order) {
        return res
          .status(404)
          .json({ error: "Order not found or does not belong to the user." });
      }

      // Check if transactionId is unique
      const existingPayment = await Payment.findOne({
        where: { transactionId },
      });
      if (existingPayment) {
        return res
          .status(400)
          .json({ error: "Transaction ID already exists." });
      }

      // Store file path
      const paymentScreenshot = `assets/images/payments/${req.file.filename}`;

      // Create payment record
      const payment = await Payment.create({
        userId,
        orderId,
        transactionId,
        paymentScreenshot,
        name,
        image,
        address,
      });

      // Update the Orders table to include paymentId
      const ordersupdate = await Orders.update(
        { paymentId: payment.id },
        { where: { orderId } }
      );
      console.log("updated order", ordersupdate);

      return res.status(201).json({
        message: "Payment submitted successfully. Awaiting verification.",
        payment,
      });
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyUserToken,
  createOrder,
  createPayment,
  resetPassword,
  forgotPassword,
};
