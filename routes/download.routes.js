import express from "express";
import path from "path";
import { fileURLToPath } from "url"; // ✅ Required to define __dirname in ES Modules
import { File } from "../models/file.models.js";

const router = express.Router();

// ✅ Define __dirname manually for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/:uuid", async (req, res) => {
    try {
        const file = await File.findOne({ uuid: req.params.uuid });

        if (!file) {
            return res.render("download", { error: "Link has expired." });
        }

        const filePath = path.join(__dirname, "..", file.path); // ✅ Corrected path joining
        res.download(filePath);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

export default router;
