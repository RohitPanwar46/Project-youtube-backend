import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDb = async ()=>{
    try {
        
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        console.log(`db connected seccessfull !! db Host: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.error("Here is some error in connecting db ==> ",error);
        throw error;
    }
}

export default connectDb;