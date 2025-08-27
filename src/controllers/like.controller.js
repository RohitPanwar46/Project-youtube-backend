import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import jwt from 'jsonwebtoken'

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    let data;
    
    // check the video exist or not
    const video = await Video.findOne({_id:videoId})

    if(!video){
        throw new ApiError(402,"video does not exist or invalid video id")
    }

    // check the video is already liked or not 

    const liked = await Like.findOne({video:{_id: videoId}, likedBy: req.user?._id}).populate("likedBy","_id name email");
    console.log("liked ===> ",liked);
    // if not liked add a like
    if (!liked) {

        await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })
        data = "liked"
    }

    // if liked then remove it from like
    if(liked){
        await Like.deleteOne({video:{_id: videoId}, likedBy: req.user?._id})
        data = "unliked"
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, data, "Like Toggled successfully from video"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    let data;
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    // check the comment exists or not
    const comment = await Comment.findOne({ _id: commentId });

    if (!comment) {
        throw new ApiError(404, "Comment does not exist");
    }

    // check if the comment is already liked or not
    const liked = await Like.findOne({ comment: { _id: commentId } });

    if (!liked) {
        const userId = req.user?._id;

        await Like.create({
            comment: commentId,
            likedBy: userId
        });
        data = "liked";
    } else {
        await Like.deleteOne({ comment: { _id: commentId } });
        data = "disliked";
    }

    return res
        .status(200)
        .json(new ApiResponse(200, data, `Comment ${data} successfully`));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    let data;

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
        
        const userId = req.user?._id;

        await Like.create({
            tweet: tweetId,
            likedBy:userId
        })
        data = "liked"
    }

    // if liked then remove it from like
    if(liked){
        await Like.deleteOne({tweet:{_id: tweetId}})
        data = "disliked"
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, data, `Tweet ${data} successfully`))
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

const getVideoLikesCount = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { userId } = req.query;
    let likedByUser = false;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    if (isValidObjectId(userId)) {
        const userLike = await Like.findOne({ video: { _id: videoId }, likedBy: userId });
        if (userLike) {
            likedByUser = true;
        }
    }


    const likesCount = await Like.countDocuments({ video: { _id: videoId } });

    return res
        .status(200)
        .json(new ApiResponse(200, { likesCount, likedByUser }, "Fetched video likes count successfully"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getVideoLikesCount
}