import File from "./models/file.models";
import fs from "fs";
import connectDB from "./config/db";
connectDB();

function deleteData() {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const files = File.find({ createdAt: { $lt: pastDate } });
    if (files.length) {
        for (const file of files) {
            try {
                fs.unlinkSync(file.path);
                file.remove();
                console.log(`Successfully deleted ${file.filename}`);
            } catch (error) {
                console.log(`Error while deleting file ${error}`);
            }
        }
    }
    console.log("Job done!");
}

deleteData().then(process.exit);