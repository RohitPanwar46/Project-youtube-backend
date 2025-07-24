import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    // check the video exist or not
    const video = await Video.findOne({_id:videoId})

    if(!video){
        throw new ApiError(401,"Liked video does not exist")
    }

    // check the video is already liked or not 

    const liked = await Like.findOne({video:{_id: videoId}});
    
    // if not liked add a like
    if (!liked) {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
        
        if(!incomingRefreshToken){
            throw new ApiError(401,"Unothorized request");
        }
        
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
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}