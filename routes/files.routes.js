import path from "path";
import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { File } from "../models/file.models.js";
import sendMail from "../services/mail.Services.js";
import emailTemplate from "../services/emailTemplate.services.js";
import moment from "moment";

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
}).single("myfile");

// File Upload Route
router.post("/", (req, res) => {
  upload(req, res, async (err) => {
    if (!req.file) {
      return res.status(400).json({ error: "Upload the file" });
    }
    if (err) {
      return res.status(500).send({ error: err.message });
    }
    try {
      // Store file in DB
      const file = new File({
        filename: req.file.filename,
        uuid: uuidv4(),
        path: req.file.path,
        size: req.file.size,
      });
      const response = await file.save();
      return res.json({ file: `${process.env.APP_BASE_URL}/files/${response.uuid}` });
    } catch (err) {
      return res.status(500).send({ error: err.message });
    }
  });
});

// Send Email Route
// Send Email Route
router.post('/send', async (req, res) => {
  const { uuid, emailFrom, emailTo } = req.body; // Extract expiresIn

  if (!uuid || !emailFrom || !emailTo) {
    return res.status(422).send({ error: "All fields are required except expiry" });
  }

  try {
    const file = await File.findOne({ uuid });
    if (!file) {
      return res.status(404).send({ error: "File not found" });
    }

    if (file.sender) {
      return res.status(422).send({ error: "Email already sent once" });
    }

    file.sender = emailFrom;
    file.recevier = emailTo;
    await file.save();

    // Send email
    await sendMail({
      from: emailFrom,
      to: emailTo,
      subject: "File Sharing",
      text: `${emailFrom} shared a file with you`,
      html: emailTemplate({
        emailFrom,
        downloadLink: `${process.env.APP_BASE_URL}/file/${file.uuid}?source=email`,
        size: parseInt(file.size/1000) + ' KB',
        expires: '24 hours'
      })
    });

    return res.send({ success: true });

  } catch (err) {
    console.error("Error in /send route:", err); // Logs the actual error
    return res.status(500).json({ error: err.message });
  }
});


export default router;
