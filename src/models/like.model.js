import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const likeSchema = new mongoose.Schema({
    video:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    tweet:{
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    comment:{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    likedBy:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})

likeSchema.plugin(mongooseAggregatePaginate)

export const Like = mongoose.model("Like", likeSchema)