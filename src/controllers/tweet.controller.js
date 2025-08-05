import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import jwt from 'jsonwebtoken'

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user?._id;

    if(!content){
        throw new ApiError(401, "Content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner: userId
    })

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet added successfully!"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;

    if(!userId){
        throw new ApiError(401, "userId is required!")
    }

    const tweets = await Tweet.aggregate([
        {$match:{owner: new mongoose.Types.ObjectId(userId)}},
    ])

    if(!tweets){
        throw new ApiError(401,"tweets not found or invalid userId")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "tweets fetched successfully!"))

})

const updateTweet = asyncHandler(async (req, res, next) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!tweetId) {
        throw new ApiError(400, "tweetId is required");
    }
    if (!content) {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // Optionally, check if the user is the owner of the tweet
    const userId = req.user._id;
    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    tweet.content = content;
    await tweet.save();

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully!"));
})

const deleteTweet = asyncHandler(async (req, res, next) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(400, "tweetId is required");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    // checking the authorization of user to delete the tweet
    const userId = req.user?._id;
    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    await tweet.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Tweet deleted successfully!"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
