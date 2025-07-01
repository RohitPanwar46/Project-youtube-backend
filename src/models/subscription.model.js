import mongoose, {Schema, Types} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        type: Schema.Types.ObjectId,
        ref : "User"
    },
    chennel:{
        type: Schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps: true});

export const subscription = mongoose.model("subscription",subscriptionSchema); 