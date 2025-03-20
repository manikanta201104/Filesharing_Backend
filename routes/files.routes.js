import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { File } from "../models/file.models.js";
import sendMail from "../services/mail.Services.js";
import emailTemplate from "../services/emailTemplate.services.js";
import moment from "moment";

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the uploads directory is absolute
const uploadDir = path.join(__dirname, "../uploads");
import fs from "fs";

// Create the uploads directory if it doesn’t exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const router = Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Use absolute path
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Align with frontend limit (100MB)
}).single("myfile");

// File Upload Route
router.post("/", (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error during file upload:", err);
      return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
      console.error("Unknown error during file upload:", err);
      return res.status(500).json({ error: `Upload error: ${err.message}` });
    }

    if (!req.file) {
      console.warn("No file uploaded in request");
      return res.status(400).json({ error: "Please upload a file" });
    }

    try {
      console.log("File uploaded successfully:", req.file);

      // Store file in DB
      const file = new File({
        filename: req.file.filename,
        uuid: uuidv4(),
        path: req.file.path,
        size: req.file.size,
      });

      const response = await file.save();
      const fileUrl = `${process.env.APP_BASE_URL}/files/${response.uuid}`;
      console.log("File saved to DB, URL:", fileUrl);

      return res.json({ file: fileUrl });
    } catch (error) {
      console.error("Error saving file to database:", error);
      return res.status(500).json({ error: `Database error: ${error.message}` });
    }
  });
});

// Send Email Route
router.post("/send", async (req, res) => {
  const { uuid, emailFrom, emailTo } = req.body;

  if (!uuid || !emailFrom || !emailTo) {
    console.warn("Missing required fields in /send request:", req.body);
    return res.status(422).json({ error: "All fields are required (uuid, emailFrom, emailTo)" });
  }

  try {
    const file = await File.findOne({ uuid });
    if (!file) {
      console.warn(`File not found for UUID: ${uuid}`);
      return res.status(404).json({ error: "File not found" });
    }

    if (file.sender) {
      console.warn(`Email already sent for file UUID: ${uuid}`);
      return res.status(422).json({ error: "Email already sent once" });
    }

    file.sender = emailFrom;
    file.receiver = emailTo; // Note: Fix typo in "recevier" to "receiver"
    await file.save();

    // Send email
    await sendMail({
      from: emailFrom,
      to: emailTo,
      subject: "File Sharing",
      text: `${emailFrom} shared a file with you`,
      html: emailTemplate({
        emailFrom,
        downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}?source=email`,
        size: parseInt(file.size / 1000) + " KB",
        expires: "24 hours",
      }),
    });

    console.log(`Email sent successfully to ${emailTo} from ${emailFrom} for file UUID: ${uuid}`);
    return res.json({ success: true });
  } catch (error) {
    console.error("Error in /send route:", error);
    return res.status(500).json({ error: `Email sending error: ${error.message}` });
  }
});

export default router;