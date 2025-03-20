import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import multer from "multer";
import connectDB from "./config/db.js";
import filesRoutes from "./routes/files.routes.js";
import showRoutes from "./routes/show.routes.js";
import downloadRoutes from "./routes/download.routes.js";

const app = express();

// Connect to the database
connectDB();

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_CLIENTS
    ? process.env.ALLOWED_CLIENTS.split(",")
    : [
        "https://filesharing-frontend-gg0t.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3001", // Add this for local testing
      ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  credentials: false,
};
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options("*", cors(corsOptions));

// Resolve __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to parse JSON
app.use(express.json());

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });
app.use("/api/files", upload.single("myfile"));

// Serve static files (e.g., uploaded files)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Set up views and view engine
app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

// Routes
app.use("/api/files", filesRoutes);
app.use("/files", showRoutes);
app.use("/files/download", downloadRoutes);

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT}`);
});