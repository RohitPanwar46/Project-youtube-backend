import dotenv from 'dotenv';
import connectDb from "./db/connectDb.js";


dotenv.config({
    path: "./env"
})

connectDb();