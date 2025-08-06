import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId || req.user?._id

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // Total videos
    const totalVideos = await Video.countDocuments({owner: channelId})

    // Total subscribers
    const totalSubscribers = await Subscription.countDocuments({channel: channelId})

    // Total video views
    const videos = await Video.find({owner: channelId}, "views")
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0)

    // Total likes on all videos
    const videoIds = videos.map(v => v._id)
    const totalLikes = await Like.countDocuments({video: {$in: videoIds}})

    res.status(200).json(new ApiResponse(200, {
        totalVideos,
        totalSubscribers,
        totalViews,
        totalLikes
    }, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId || req.user?._id

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    const videos = await Video.find({owner: channelId})

    res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }