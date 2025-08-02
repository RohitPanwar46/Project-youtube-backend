import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const filter = {}
    if (query) {
        filter.title = { $regex: query, $options: "i" }
    }
    if (userId && isValidObjectId(userId)) {
        filter.owner = userId
    }

    let sort = {}
    if (sortBy) {
        sort[sortBy] = sortType === "desc" ? -1 : 1
    } else {
        sort.createdAt = -1
    }

    const videos = await Video.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate("owner", "username avatar")
        .exec()

    const total = await Video.countDocuments(filter)

    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        }, "Videos fetched successfully")
    )

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
