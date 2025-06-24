import dotenv from 'dotenv';
import connectDb from "./db/connectDb.js";
import { app } from './app.js';

dotenv.config({
    path: "./.env"
})

const port = process.env.PORT || 8000;

connectDb()
.then(()=>{
    app.listen(port, () =>{
        console.log(`server is listening on port ${port}`);
        
    })
})
.catch((error => {
    console.log("Mongodb connection Error message from index.js file !! ",error);
    
}))