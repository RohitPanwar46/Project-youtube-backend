import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

let isConnected = false;

const connectDb = async ()=>{
    if (isConnected) {
            return;
        }

    try {
        if (mongoose.connection.readyState === 1) {
            // If there's already an open connection, use it
            isConnected = true;
            return;
        }

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        console.log(`db connected seccessfull !! db Host: ${connectionInstance.connection.host}`);
        isConnected = true;
    } catch (error) {
        console.error("Here is some error in connecting db ==> ",error);
        throw error;
    }
}

export default connectDb;