const Week = require("../models/weeks");
const Challenges = require("../models/challenges");
const Products = require("../models/products");
const Rewards = require("../models/rewards");
const User = require("../models/user");
const ChallengeSubmitForm = require("../models/challengesForm");
const Redeem = require("../models/redeem");
const Payment = require("../models/payment");
const Orders = require("../models/order");
const Users = require("../models/user");
const uploadImage = require("../middleware/uploadMiddleware");
const { Op } = require("sequelize");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const numberToWords = require("number-to-words");
const puppeteer = require("puppeteer");

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
  amountInWords,
  customerAddress,
  customerGstNumber
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
                    <p><strong>Customer GSTIN:</strong> ${customerGstNumber}</p>
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
                <div class="total-row final" style="font-size: 1.1rem;">
                    <span style="font-weight: bold; color: orange;">Total Paid Amount: ₹${amount}</span>
                </div>
                <div class="total-row" style="font-size: 0.9rem; color: var(--text-primary); font-weight: 500;">
                    <span>Total Amount in Words: ${amountInWords}</span>
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

//{week}
// **Create a New Week**
const createWeek = async (req, res) => {
  try {
    const { name, status } = req.body;

    // Validate input
    if (!name || !status) {
      return res.status(400).json({ error: "Name and status are required" });
    }

    const newWeek = await Week.create({ name, status });
    res
      .status(201)
      .json({ message: "Week created successfully", week: newWeek });
  } catch (error) {
    console.error("Error creating week:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// **Get All Weeks**
const getAllWeeks = async (req, res) => {
  try {
    const weeks = await Week.findAll();
    res.status(200).json(weeks);
  } catch (error) {
    console.error("Error fetching weeks:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// **Get a Single Week by ID**
const getWeekById = async (req, res) => {
  try {
    const { id } = req.params;
    const week = await Week.findByPk(id);

    if (!week) {
      return res.status(404).json({ error: "Week not found" });
    }

    res.status(200).json(week);
  } catch (error) {
    console.error("Error fetching week:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// **Update a Week by ID**
const updateWeek = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    // Find the week by ID
    const week = await Week.findByPk(id);
    if (!week) {
      return res.status(404).json({ error: "Week not found" });
    }

    // Update fields if provided
    week.name = name || week.name;
    week.status = status || week.status;

    await week.save();

    res.status(200).json({ message: "Week updated successfully", week });
  } catch (error) {
    console.error("Error updating week:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// **Delete a Week by ID**
const deleteWeek = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the week
    const deletedWeek = await Week.destroy({ where: { id } });

    if (!deletedWeek) {
      return res.status(404).json({ error: "Week not found" });
    }

    res.status(200).json({ message: "Week deleted successfully" });
  } catch (error) {
    console.error("Error deleting week:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//{challenges}
// Create a new challenge
const createChallenge = async (req, res) => {
  try {
    // Handle multiple file fields (3 images)
    uploadImage("challenges").fields([
      { name: "challenge_image1", maxCount: 1 },
      { name: "challenge_image2", maxCount: 1 },
      { name: "challenge_image3", maxCount: 1 },
    ])(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      const { name, shortDescription, descriptions, rewards, status, weekId } =
        req.body;

      // Convert descriptions into an array (JSON.parse if sent as stringified JSON)
      const descriptionsArray = descriptions ? JSON.parse(descriptions) : [];

      // Process uploaded images
      const imageFiles = [
        req.files["challenge_image1"]
          ? `assets/images/challenges/${req.files["challenge_image1"][0].filename}`
          : null,
        req.files["challenge_image2"]
          ? `assets/images/challenges/${req.files["challenge_image2"][0].filename}`
          : null,
        req.files["challenge_image3"]
          ? `assets/images/challenges/${req.files["challenge_image3"][0].filename}`
          : null,
      ].filter(Boolean); // Remove null values

      // Create a new challenge record
      const challenge = await Challenges.create({
        name,
        shortDescription,
        descriptions: descriptionsArray,
        challenge_images: JSON.stringify(imageFiles),
        rewards,
        status,
        weekId,
      });

      res
        .status(201)
        .json({ message: "Challenge created successfully", challenge });
    });
  } catch (error) {
    console.error("Error creating challenge:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Get all challenges
const getAllChallenges = async (req, res) => {
  try {
    const challenges = await Challenges.findAll({
      include: [{ model: Week, as: "week" }],
    });
    res.status(200).json(challenges);
  } catch (error) {
    console.error("Error fetching challenges:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single challenge by ID
const getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenges.findByPk(req.params.id, {
      include: [{ model: Week, as: "week" }],
    });
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });
    res.status(200).json(challenge);
  } catch (error) {
    console.error("Error fetching challenge:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a challenge
const updateChallenge = async (req, res) => {
  try {
    console.log("Update Challenge API called");

    // Check if only the status is being updated
    if (req.body.status && Object.keys(req.body).length === 1) {
      console.log("Updating only status...");

      const challenge = await Challenges.findByPk(req.params.id);
      if (!challenge) {
        console.error("Challenge not found");
        return res.status(404).json({ error: "Challenge not found" });
      }

      await challenge.update({ status: req.body.status });

      return res
        .status(200)
        .json({ message: "Status updated successfully", challenge });
    }

    // Handle file uploads
    uploadImage("challenges").fields([
      { name: "challenge_image1", maxCount: 1 },
      { name: "challenge_image2", maxCount: 1 },
      { name: "challenge_image3", maxCount: 1 },
    ])(req, res, async (err) => {
      console.log("File upload middleware executed");

      if (err) {
        console.error("File upload error:", err);
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      console.log("Request Body:", req.body);
      console.log("Uploaded Files:", req.files);

      const { name, shortDescription, descriptions, rewards, status, weekId } =
        req.body;

      // Find existing challenge
      const challenge = await Challenges.findByPk(req.params.id);
      if (!challenge) {
        console.error("Challenge not found");
        return res.status(404).json({ error: "Challenge not found" });
      }
      console.log("Challenge found:", challenge);

      // Preserve existing descriptions if not updated
      let updatedDescriptions = challenge.descriptions;
      if (descriptions) {
        try {
          console.log("Raw descriptions:", descriptions);
          const parsedDescriptions = JSON.parse(descriptions);
          if (Array.isArray(parsedDescriptions)) {
            updatedDescriptions = parsedDescriptions;
          }
        } catch (error) {
          console.error("Invalid descriptions format:", error);
          return res.status(400).json({ error: "Invalid descriptions format" });
        }
      }

      // ✅ Retrieve and Parse Existing Images (Fix)
      let existingImages = [];
      try {
        existingImages =
          typeof challenge.challenge_images === "string"
            ? JSON.parse(challenge.challenge_images)
            : Array.isArray(challenge.challenge_images)
            ? challenge.challenge_images
            : [];
      } catch (error) {
        console.error("Invalid existing image format:", error);
        return res.status(500).json({ error: "Invalid existing image format" });
      }

      console.log("Existing Images (Parsed):", existingImages);

      // Ensure existingImages has at least 3 slots
      existingImages = [
        existingImages[0] || null,
        existingImages[1] || null,
        existingImages[2] || null,
      ];

      // ✅ Update Only the Provided Images (Fix)
      const updatedImages = [...existingImages];
      if (req.files?.["challenge_image1"]) {
        updatedImages[0] = `assets/images/challenges/${req.files["challenge_image1"][0].filename}`;
      }
      if (req.files?.["challenge_image2"]) {
        updatedImages[1] = `assets/images/challenges/${req.files["challenge_image2"][0].filename}`;
      }
      if (req.files?.["challenge_image3"]) {
        updatedImages[2] = `assets/images/challenges/${req.files["challenge_image3"][0].filename}`;
      }

      console.log("Final updated images:", updatedImages);

      // ✅ Update Challenge with Correct Image Array
      await challenge.update({
        name: name || challenge.name,
        shortDescription: shortDescription || challenge.shortDescription,
        descriptions: updatedDescriptions,
        challenge_images: JSON.stringify(updatedImages), // ✅ Store as JSON string
        rewards: rewards || challenge.rewards,
        status: status || challenge.status,
        weekId: weekId || challenge.weekId,
      });

      console.log("Challenge updated successfully");

      res
        .status(200)
        .json({ message: "Challenge updated successfully", challenge });
    });
  } catch (error) {
    console.error("Error updating challenge:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Delete a challenge
const deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenges.findByPk(req.params.id);
    if (!challenge)
      return res.status(404).json({ error: "Challenge not found" });

    await challenge.destroy();
    res.status(200).json({ message: "Challenge deleted successfully" });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//{Product}
// Create a new product
const createProduct = async (req, res) => {
  try {
    uploadImage("products").single("product_image")(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      const { name, description, oldPrice, status, inStock } = req.body;
      const imagePath = req.file
        ? `assets/images/products/${req.file.filename}`
        : null;

      if (!name || !description || !oldPrice || !status) {
        return res.status(400).json({
          error: "Name, description, old Price, and status are required",
        });
      }

      const oldPriceValue = parseFloat(oldPrice);
      if (isNaN(oldPriceValue) || oldPriceValue <= 0) {
        return res.status(400).json({ error: "Invalid old price" });
      }

      // Automatically calculate new prices based on user type
      const priceForDoctor = oldPriceValue * 0.7; // 30% discount
      const priceForOtherUser = oldPriceValue * 0.8; // 20% discount
      const priceForUser = oldPriceValue * 0.9;

      const isProductInStock =
        inStock !== undefined ? JSON.parse(inStock) : true;

      const product = await Products.create({
        name,
        description,
        oldPrice: oldPriceValue,
        priceForDoctor: parseFloat(priceForDoctor.toFixed(2)), // Rounded to 2 decimal places
        priceForOtherUser: parseFloat(priceForOtherUser.toFixed(2)),
        priceForUser: parseFloat(priceForUser.toFixed(2)),
        product_image: imagePath.length > 0 ? JSON.stringify(imagePath) : null,
        status,
        inStock: isProductInStock,
      });

      // Determine the stock status message
      const stockMessage = isProductInStock
        ? "Product is in stock"
        : "Currently, product is out of stock";

      res.status(201).json({
        message: "Product created successfully",
        stockStatus: stockMessage,
        product,
      });
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Products.findAll();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    uploadImage("products").single("product_image")(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      const { name, description, oldPrice, newPrice, status, inStock } =
        req.body;
      const product = await Products.findByPk(req.params.id);

      if (!product) return res.status(404).json({ error: "Product not found" });

      // Use the new uploaded image if available, otherwise keep the existing image
      const imageFile = req.file
        ? `assets/images/products/${req.file.filename}`
        : product.product_image;

      await product.update({
        name: name || product.name,
        description: description || product.description,
        oldPrice:
          oldPrice !== undefined ? parseFloat(oldPrice) : product.oldPrice,
        newPrice:
          newPrice !== undefined ? parseFloat(newPrice) : product.newPrice,
        product_image: imageFile, // No need for JSON.stringify() if storing a single image
        status: status || product.status,
        inStock: inStock !== undefined ? JSON.parse(inStock) : product.inStock,
      });

      const stockMessage = product.inStock
        ? "Product is in stock"
        : "Currently, product is out of stock";

      res.status(200).json({
        message: "Product updated successfully",
        stockStatus: stockMessage,
        product,
      });
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    await product.destroy();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//{Rewards}
// Create a new reward
const createReward = async (req, res) => {
  try {
    uploadImage("rewards").single("reward_image")(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      const { name, description, points, status } = req.body;
      if (!name || !description || !points || !status) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const rewardImage = req.file
        ? `assets/images/rewards/${req.file.filename}`
        : null;

      const reward = await Rewards.create({
        name,
        description,
        points: parseInt(points),
        status,
        reward_image: rewardImage ? JSON.stringify([rewardImage]) : null,
      });

      res.status(201).json({ message: "Reward created successfully", reward });
    });
  } catch (error) {
    console.error("Error creating reward:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all rewards
const getAllRewards = async (req, res) => {
  try {
    const rewards = await Rewards.findAll();
    res.status(200).json({ rewards });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get reward by ID
const getRewardById = async (req, res) => {
  try {
    const reward = await Rewards.findByPk(req.params.id);
    if (!reward) return res.status(404).json({ error: "Reward not found" });
    res.status(200).json({ reward });
  } catch (error) {
    console.error("Error fetching reward:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update reward
const updateReward = async (req, res) => {
  try {
    uploadImage("rewards").single("reward_image")(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      const { name, description, points, status } = req.body;
      const reward = await Rewards.findByPk(req.params.id);
      if (!reward) return res.status(404).json({ error: "Reward not found" });

      const rewardImage = req.file
        ? `assets/images/rewards/${req.file.filename}`
        : reward.reward_image;

      await reward.update({
        name: name || reward.name,
        description: description || reward.description,
        points: points !== undefined ? parseInt(points) : reward.points,
        status: status || reward.status,
        reward_image: req.file
          ? JSON.stringify([rewardImage])
          : reward.reward_image,
      });

      res.status(200).json({ message: "Reward updated successfully", reward });
    });
  } catch (error) {
    console.error("Error updating reward:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete reward
const deleteReward = async (req, res) => {
  try {
    const reward = await Rewards.findByPk(req.params.id);
    if (!reward) return res.status(404).json({ error: "Reward not found" });
    await reward.destroy();
    res.status(200).json({ message: "Reward deleted successfully" });
  } catch (error) {
    console.error("Error deleting reward:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//{users}
//getAllUsers
const getAllUsers = async (req, res) => {
  try {
    // Fetch all users, excluding passwords for security
    const users = await User.findAll({
      attributes: { exclude: ["password"] }, // Exclude passwords from response
    });

    return res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//{ChallengeForm}
//getAllChallengeForm
const getAllChallengeForms = async (req, res) => {
  try {
    // Fetch all challenge submissions
    const allChallenges = await ChallengeSubmitForm.findAll({
      attributes: [
        "id",
        "userId",
        "name",
        "phone",
        "remark",
        "mediaType",
        "mediaFiles",
        "challengeId",
        "isVerified",
        "status",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]], // Sort by latest submissions
    });

    if (!allChallenges.length) {
      return res.status(404).json({ error: "No challenge forms found." });
    }

    // Convert mediaFiles if necessary
    const formattedChallenges = allChallenges.map((challenge) => {
      let mediaFiles = challenge.mediaFiles;

      if (typeof mediaFiles === "string") {
        try {
          mediaFiles = JSON.parse(mediaFiles);
        } catch (error) {
          console.error("Error parsing mediaFiles:", error);
          mediaFiles = [];
        }
      }

      return { ...challenge.get(), mediaFiles };
    });

    console.log("Fetched Challenges:", formattedChallenges.length);

    res.status(200).json(formattedChallenges);
  } catch (error) {
    console.error("Error fetching challenge forms:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

//updateChallengeForm
const updateChallengeForm = async (req, res) => {
  try {
    const uploadPath =
      req.body.mediaType === "images"
        ? "assets/images/challengesForm"
        : "assets/videos/challengesForm";

    uploadImage(uploadPath).array("mediaFiles", 5)(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: `File upload error: ${err.message}` });
      }

      console.log("Request Body:", req.body);
      console.log("Uploaded Files:", req.files);

      const { id } = req.params;
      let { name, phone, remark, mediaType, isVerified } = req.body;

      // Find the existing challenge submission
      const challengeForm = await ChallengeSubmitForm.findByPk(id);
      if (!challengeForm) {
        return res
          .status(404)
          .json({ error: "Challenge submission not found" });
      }

      // Validate media type
      if (mediaType && !["images", "video"].includes(mediaType)) {
        return res
          .status(400)
          .json({ error: "Invalid media type. Allowed: images, video" });
      }

      let mediaFiles = [];
      if (challengeForm.mediaFiles) {
        try {
          mediaFiles =
            typeof challengeForm.mediaFiles === "string"
              ? JSON.parse(challengeForm.mediaFiles)
              : challengeForm.mediaFiles;
        } catch (error) {
          console.error("Error parsing mediaFiles:", error);
          mediaFiles = [];
        }
      }

      if (req.files && req.files.length > 0) {
        const newFiles = req.files.map(
          (file) => `${uploadPath}/${file.filename}`
        );
        mediaFiles = [...mediaFiles, ...newFiles];
      }

      if (mediaType === "images" && mediaFiles.length > 5) {
        return res.status(400).json({ error: "Maximum 5 images allowed." });
      }

      if (mediaType === "video" && mediaFiles.length > 1) {
        return res.status(400).json({ error: "Only 1 video is allowed." });
      }

      // Convert isVerified to an integer
      isVerified = parseInt(isVerified, 10);
      console.log("Parsed isVerified:", isVerified, typeof isVerified);

      // Handle challenge status update
      if (isVerified === 2) {
        challengeForm.status = "Rejected";
      } else if (isVerified === 1) {
        challengeForm.status = "Approved";

        // ✅ Fetch the related challenge to get reward points
        const challenge = await Challenges.findByPk(challengeForm.challengeId);
        if (!challenge || !challenge.rewards) {
          return res.status(400).json({ error: "Challenge rewards not found" });
        }

        const rewardPoints = parseInt(challenge.rewards, 10) || 0;

        // ✅ Fetch the user
        const user = await User.findByPk(challengeForm.userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // ✅ Update points only for Doctors
        if (user.userType === "Doctor") {
          user.points += rewardPoints;
          await user.save();
        }
      } else if (isVerified === 0) {
        challengeForm.status = "Pending";
      } else {
        console.warn("Invalid isVerified value received:", isVerified);
      }

      challengeForm.isVerified = isVerified;
      challengeForm.name = name || challengeForm.name;
      challengeForm.phone = phone || challengeForm.phone;
      challengeForm.remark = remark || challengeForm.remark;
      challengeForm.mediaType = mediaType || challengeForm.mediaType;
      challengeForm.mediaFiles =
        mediaFiles.length > 0
          ? JSON.stringify(mediaFiles)
          : challengeForm.mediaFiles;

      // Save updated challenge record
      await challengeForm.save();

      return res.status(200).json({
        message: "Challenge updated successfully",
        challengeForm,
      });
    });
  } catch (error) {
    console.error("Error updating challenge:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//{Redeem}
// Create a new redeem
const getAllRedeemedRewards = async (req, res) => {
  try {
    // Fetch all redeemed rewards with user and reward details
    const allRedeemedRewards = await Redeem.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"], // Fetch user details
        },
        {
          model: Rewards,
          as: "reward",
          attributes: ["id", "name", "points"], // Fetch reward details
        },
      ],
      attributes: ["id", "redeemedAt"], // Fetch redemption details
    });

    // Calculate total redemptions
    const totalRedemptions = allRedeemedRewards.length;

    return res.status(200).json({
      message: "All redeemed rewards fetched successfully.",
      totalRedemptions, // Count for the dashboard
      redeemedRewards: allRedeemedRewards, // List of all redemptions
    });
  } catch (error) {
    console.error("Error fetching all redeemed rewards:", error);
    return res.status(500).json({
      error: `Error fetching redeemed rewards: ${error.message}`,
    });
  }
};

//{redeemGraph}
const getRedeemedRewardsGraph = async (req, res) => {
  try {
    // Get the current date
    const today = moment().startOf("day");
    const sevenDaysAgo = moment(today).subtract(6, "days");

    console.log(
      "Fetching redemptions from:",
      sevenDaysAgo.toDate(),
      "to",
      today.endOf("day").toDate()
    );

    // Fetch redeemed rewards from the last 7 days, including today
    const redeemedRewards = await Redeem.findAll({
      where: {
        redeemedAt: {
          [Op.between]: [sevenDaysAgo.toDate(), today.endOf("day").toDate()],
        },
      },
      attributes: ["redeemedAt"], // Fetch only the redemption date
    });

    // Initialize an array with all the dates for the last 7 days
    const dateCounts = Array.from({ length: 7 }, (_, i) => {
      const date = moment(sevenDaysAgo).add(i, "days");
      return {
        date: date.format("YYYY-MM-DD"), // Format the date as a string
        redemptions: 0, // Initial redemption count is zero
      };
    });

    console.log("Redeemed rewards count:", redeemedRewards.length);

    // Count redemptions for each day
    redeemedRewards.forEach((reward) => {
      const redemptionDate = moment(reward.redeemedAt).format("YYYY-MM-DD");
      const dayEntry = dateCounts.find(
        (entry) => entry.date === redemptionDate
      );
      if (dayEntry) {
        dayEntry.redemptions += 1; // Increment redemption count
      }
    });

    // Respond with the data
    res.status(200).json({
      message: "Redeemed rewards data for the last 7 days",
      data: dateCounts,
    });
  } catch (error) {
    console.error(
      "Error fetching redeemed rewards graph data:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

//{payments/SoldItems}
const getAllCompletedPayments = async (req, res) => {
  try {
    const completedPayments = await Orders.findAll({
      where: { status: "Completed" }, // Fetch only completed payments
    });

    res.status(200).json(completedPayments);
  } catch (error) {
    console.error("Error fetching completed payments:", error);
    res.status(500).json({ error: "Server error" });
  }
};
//{paymentWithInvoices}
const getAllCompletedPaymentsWithInvoices = async (req, res) => {
  try {
    // Fetch all completed payments
    const completedPayments = await Payment.findAll({
      where: { paymentStatus: "Verified" }, // Fetch only completed payments
    });

    if (!completedPayments.length) {
      return res.status(404).json({ error: "No completed payments found" });
    }

    // Define the invoices directory path
    const invoicesDir = path.join(__dirname, "../invoices");

    // Ensure the directory exists
    if (!fs.existsSync(invoicesDir)) {
      console.error("Invoices directory does not exist!");
      return res.status(404).json({ error: "No invoices found" });
    }

    // Read all files in the invoices directory
    const files = fs.readdirSync(invoicesDir);

    // Map payments to include their corresponding invoices
    const paymentsWithInvoices = completedPayments.map((payment) => {
      const userInvoices = files
        .filter(
          (file) =>
            file.startsWith(`invoice-${payment.userId}-`) &&
            file.endsWith(".pdf")
        )
        .map((file) => `/invoices/${file}`);

      return {
        ...payment.toJSON(), // Convert Sequelize object to plain JSON
        invoices: userInvoices, // Attach invoice URLs
      };
    });

    res.status(200).json({ payments: paymentsWithInvoices });
  } catch (error) {
    console.error("Error fetching completed payments with invoices:", error);
    res.status(500).json({ error: "Server error" });
  }
};

//{soldItemsGraph}
const getCompletedPaymentsGraph = async (req, res) => {
  try {
    // Get the current date
    const today = moment().startOf("day");
    const sevenDaysAgo = moment(today).subtract(6, "days");

    // Fetch completed payments from the last 7 days
    const completedPayments = await Orders.findAll({
      where: {
        status: "Completed",
        createdAt: {
          [Op.between]: [sevenDaysAgo.toDate(), today.endOf("day").toDate()],
        },
      },
      attributes: ["createdAt"], // Only fetch createdAt for counting
    });

    // Initialize an array with all the dates for the last 7 days
    const dateCounts = Array.from({ length: 7 }, (_, i) => {
      const date = moment(sevenDaysAgo).add(i, "days");
      return {
        date: date.format("YYYY-MM-DD"), // Format the date as a string
        orders: 0, // Initial count is zero
      };
    });

    // Count payments for each day
    completedPayments.forEach((payment) => {
      const paymentDate = moment(payment.createdAt).format("YYYY-MM-DD");
      const dayEntry = dateCounts.find((entry) => entry.date === paymentDate);
      if (dayEntry) {
        dayEntry.orders += 1; // Increment count for that day
      }
    });

    // Respond with the graph data
    res.status(200).json({
      message: "Completed payments data for the last 7 days",
      data: dateCounts,
    });
  } catch (error) {
    console.error("Error fetching completed payments graph data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//allPayments
const getAllPayments = async (req, res) => {
  try {
    // Fetch all payments
    const payments = await Payment.findAll();

    if (!payments.length) {
      return res.status(404).json({ error: "No payments found" });
    }

    // Define the invoices directory path
    const invoicesDir = path.join(__dirname, "../invoices");

    // Ensure the directory exists
    if (!fs.existsSync(invoicesDir)) {
      console.error("Invoices directory does not exist!");
      return res.status(404).json({ error: "No invoices found" });
    }

    // Read all invoice files
    const files = fs.readdirSync(invoicesDir);

    // Attach invoice URLs for each payment based on `orderId`
    const paymentsWithInvoices = payments.map((payment) => {
      const invoiceFile = files.find((file) =>
        file.startsWith(`invoice-${payment.userId}-${payment.orderId}`)
      );

      return {
        ...payment.toJSON(), // Convert Sequelize object to plain JSON
        invoiceUrl: invoiceFile ? `/invoices/${invoiceFile}` : null, // Attach single invoice URL
      };
    });

    return res.status(200).json({ payments: paymentsWithInvoices });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

//allOrders
const getAllOrders = async (req, res) => {
  try {
    // Fetch all orders
    const orders = await Orders.findAll();

    // Fetch product details manually
    const ordersWithProductNames = await Promise.all(
      orders.map(async (order) => {
        const product = await Products.findOne({
          where: { id: order.productId },
          attributes: ["name"],
        });

        return {
          ...order.toJSON(),
          productName: product ? product.name : "Unknown Product", // If no product found
        };
      })
    );

    return res.status(200).json({ orders: ordersWithProductNames });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId, status } = req.body;

    if (!["Verified", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    // Find payment record
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found." });
    }

    if (payment.paymentStatus !== "Verifying") {
      return res
        .status(400)
        .json({ message: "Payment status cannot be changed." });
    }

    // Update payment status
    payment.paymentStatus = status;
    await payment.save();

    // If payment is verified, update the order status to "Completed"
    if (status === "Verified") {
      const order = await Orders.findOne({
        where: { orderId: payment.orderId },
      });

      if (order) {
        order.status = "Completed";
        await order.save();

        // Fetch user details
        const user = await Users.findByPk(payment.userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        // Convert amount to words
        const amountInWords = numberToWords.toWords(order.amount);

        // Parse the address JSON if it's a string
        let parsedAddress;
        try {
          parsedAddress = JSON.parse(payment.address);
        } catch (error) {
          console.error("Error parsing address:", error);
          parsedAddress = {}; // Default to an empty object if parsing fails
        }

        // Construct the formatted address
        const formattedAddress = `${parsedAddress.address || ""}, ${
          parsedAddress.city || ""
        }, ${parsedAddress.state || ""}, ${parsedAddress.pincode || ""}`;

        // Extract GST Number
        const customerGstNumber = parsedAddress.gstNumber || "N/A"; // Default to "N/A" if missing

        console.log("Generating invoice PDF for:", {
          userId: payment.userId,
          orderId: payment.orderId,
          amount: order.amount,
          transactionId: payment.transactionId,
          address: formattedAddress,
          gstNumber:customerGstNumber
        });

        // Generate Invoice PDF in the background
        generateInvoicePDF({
          userId: payment.userId,
          name: user.name,
          phoneNumber: user.phone,
          invoiceDate: new Date().toISOString().split("T")[0],
          invoiceTime: new Date().toLocaleTimeString(),
          orderId: payment.orderId,
          transactionId: payment.transactionId,
          amount: order.amount,
          productinfo: payment.name,
          quantity: order.quantity,
          customerAddress: formattedAddress,
          customerGstNumber: customerGstNumber, // Include GST Number
          amountInWords: amountInWords,
        })
          .then(() => console.log("Invoice PDF generated successfully"))
          .catch((err) => console.error("Error generating invoice PDF:", err));
      }
    }

    // Send response immediately, while invoice generation happens in the background
    res
      .status(200)
      .json({ message: `Payment status updated to ${status}`, payment });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  createWeek, //{weeks}
  getAllWeeks,
  getWeekById,
  updateWeek,
  deleteWeek,
  createChallenge, //{challenges}
  getAllChallenges,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
  createProduct, //{products}
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createReward, //{Rewards}
  getAllRedeemedRewards, //{redeem}
  getRedeemedRewardsGraph,
  getAllRewards,
  getRewardById,
  updateReward,
  deleteReward,
  getAllUsers, //{user}
  getAllChallengeForms, //{ChallengeForm}
  updateChallengeForm,
  getAllCompletedPayments, //{payments/SoldItems}
  getAllCompletedPaymentsWithInvoices,
  getCompletedPaymentsGraph,
  getAllPayments, //allpayments
  getAllOrders, //allorders
  updatePaymentStatus,
};
