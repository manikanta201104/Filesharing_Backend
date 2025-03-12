import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { DB_NAME } from '../constants.js';

const connectDB=async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.DB_URI}/${DB_NAME}`);
        console.log(`MongoDB is connected to ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection is FAILED :",error);
        process.exit(1);
    }
}

export default connectDB;