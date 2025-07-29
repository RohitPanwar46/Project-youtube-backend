import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import { response } from "express"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unothorized request");
    }
    
    // check the video exist or not
    const video = await Video.findOne({_id:videoId})

    if(!video){
        throw new ApiError(401,"video does not exist")
    }

    // check the video is already liked or not 

    const liked = await Like.findOne({video:{_id: videoId}});
    
    // if not liked add a like
    if (!liked) {
        
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.ACCESS_TOKEN_SECRET);

        await Like.create({
            video: videoId,
            likedBy:decodedToken._id
        })
    }

    // if liked then remove it from like
    if(liked){
        await Like.deleteOne({video:{_id: videoId}})
    }
    
    return res
    .status(200)
    .json(new response(200, {}, "Like Toggled successfully from video"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unothorized request");
    }

    // check the comment exist or not
    const comment = await Comment.findOne({_id:commentId})

    if(!comment){
        throw new ApiError(401,"comment does not exist")
    }
    
    // check the comment is already liked or not 
    
    const liked = await Like.findOne({comment:{_id: commentId}});
    
    // if not liked add a like
    if (!liked) {
        
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.ACCESS_TOKEN_SECRET);

        await Like.create({
            comment: commentId,
            likedBy:decodedToken._id
        })
    }

    // if liked then remove it from like
    if(liked){
        await Like.deleteOne({comment:{_id: commentId}})
    }
    
    return res
    .status(200)
    .json(new response(200, {}, "Like Toggled successfully from comment"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unothorized request");
    }

    // check the tweet exist or not
    const tweet = await Tweet.findOne({_id:tweetId})

    if(!tweet){
        throw new ApiError(401,"tweet does not exist")
    }

    // check the tweet is already liked or not 

    const liked = await Like.findOne({tweet:{_id: tweetId}});
    
    // if not liked add a like
    if (!liked) {
        
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.ACCESS_TOKEN_SECRET);

        await Like.create({
            tweet: tweetId,
            likedBy:decodedToken._id
        })
    }

    // if liked then remove it from like
    if(liked){
        await Like.deleteOne({tweet:{_id: tweetId}})
    }
    
    return res
    .status(200)
    .json(new response(200, {}, "Like Toggled successfully from tweet"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    const jwt = await import("jsonwebtoken");
    const decodedToken = jwt.default.verify(incomingRefreshToken, process.env.ACCESS_TOKEN_SECRET);

    const likedVideos = await Like.aggregate([
        {$match:{likedBy: new mongoose.Types.ObjectId(decodedToken._id),video:{$exists:true, $ne: null}}},
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $replaceRoot: {newRoot: "$videoDetails"}
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Fetched liked videos successfully"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}