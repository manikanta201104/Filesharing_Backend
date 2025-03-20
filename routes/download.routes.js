import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { File } from "../models/file.models.js";
import fs from "fs"; // ✅ To check if the file exists

const router = express.Router();

// ✅ Define __dirname manually for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/:uuid", async (req, res) => {
  try {
    // Find the file in the database
    const file = await File.findOne({ uuid: req.params.uuid });

    if (!file) {
      console.warn(`File not found for UUID: ${req.params.uuid}`);
      return res.render("download", { error: "Link has expired or file not found." });
    }

    // Construct the file path
    // Since file.path is likely an absolute path (e.g., /path/to/project/uploads/filename),
    // we should use it directly instead of joining with __dirname
    const filePath = file.path;

    // ✅ Check if the file exists on the server
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist on server: ${filePath}`);
      return res.render("download", { error: "File not found on server. It may have been deleted or expired." });
    }

    console.log(`Downloading file: ${filePath}`);
    res.download(filePath, file.filename, (err) => {
      if (err) {
        console.error(`Error downloading file: ${filePath}`, err);
        return res.status(500).render("download", { error: "Error downloading file. Please try again later." });
      }
    });
  } catch (error) {
    console.error("Error in download route:", error);
    return res.status(500).render("download", { error: "An unexpected error occurred. Please try again later." });
  }
});

export default router;