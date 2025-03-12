import dotenv from "dotenv";
dotenv.config(); 

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import filesRoutes from "./routes/files.routes.js";
import showRoutes from "./routes/show.routes.js";
import downloadRoutes from "./routes/download.routes.js";
import cors from "cors";


const app = express();
connectDB(); 

const corsOptions= {
    origin:process.env.ALLOWED_CLIENTS.split(",")
};
app.use(cors(corsOptions));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json()); 

// Routes
app.use("/api/files", filesRoutes);
app.use("/files", showRoutes);
app.use("/files/download", downloadRoutes);

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});
