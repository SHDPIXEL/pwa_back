require("dotenv").config();
const express = require("express");
const cors = require("cors"); // Import CORS middleware
const path = require('path')
require("./connection");


const PORT = process.env.PORT || 3000; // Use a fallback port if PORT is undefined

if (PORT === 3000) {
  console.error(
    "Error: No port specified. Please set the PORT environment variable."
  );
  process.exit(1); // Exit the application with an error
}

const app = express();
// Use CORS middleware for all routes
app.use(cors()); // Enable CORS for all routes

//Import Admin Routes
const authRouteradmin = require("./routes/authAdminRoutes");
const adminRoutes = require("./routes/adminRoutes")

//Import User Routes
const authRouteruser = require('./routes/authUserRouter')
const userRoutes = require('./routes/userRoutes')

// Middleware to parse JSON
app.use(express.json());

// Base route
app.get("/", (req, res) => {
  res.status(403).send(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #272827;;
              color: #f5eeee;;
              text-align: center;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              overflow: hidden;
            }
            h1 {
              font-size: 48px;
              animation: fadeInUp 1.5s ease-out;
            }
            p {
              font-size: 20px;
            }
            .container {
              max-width: 600px;
              background-color: rgba(0, 0, 0, 0.49);
              border-radius: 8px;
              padding: 40px;
              ba
              box-shadow: 0 4px 8px rgba(245, 238, 238, 0.79);;
              transform: translateY(30px);
              opacity: 0;
              animation: slideUp 1s forwards, fadeIn 1.5s forwards;
            }
            .container p {
              animation-delay: 1.5s;
            }
  
            /* Animation definitions */
            @keyframes fadeIn {
              0% {
                opacity: 0;
              }
              100% {
                opacity: 1;
              }
            }
  
            @keyframes slideUp {
              0% {
                transform: translateY(30px);
                opacity: 0;
              }
              100% {
                transform: translateY(0);
                opacity: 1;
              }
            }
  
            @keyframes fadeInUp {
              0% {
                opacity: 0;
                transform: translateY(20px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
  
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Access Denied (403)</h1>
            <p>Sorry, you are not allowed to access this page.</p>
          </div>
        </body>
      </html>
    `);
});

// Serve static files from the "assets" folder
app.use('/assets', express.static(path.join(__dirname, 'assets')));

//Admin
app.use("/api/auth", authRouteradmin);
app.use("/admin",adminRoutes)

//User
app.use("/auth/user",authRouteruser)
app.use("/user",userRoutes)

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
