import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export default async ({ from, to, subject, text, html }) => {
    try {
        const result = await transporter.sendMail({
            from:`FileSharing <${from}>`, // ✅ You can use any email here
            to,
            subject,
            text,
            html,
        });

        console.log("Email sent successfully!", result);
        return result;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};
