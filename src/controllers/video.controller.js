import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from "cloudinary"

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

    if(!title && !description){
        throw new ApiError(401, "Title and description is required")
    }

    const videoFileLocalPath = await req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = await req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath && !thumbnailLocalPath) {
        throw new ApiError(401, "video and thumbnail is required")
    }

    let videoRef = await uploadOnCloudinary(videoFileLocalPath);
    let thumbnailRef = await uploadOnCloudinary(thumbnailLocalPath);

    if(!videoRef && !thumbnailRef){
        throw new ApiError(500,"failed to uplaod video or thumbnail on cloudinary")
    }

    const video = await Video.create({
        videoFile: videoRef.secure_url,
        thumbnail: thumbnailRef.secure_url,
        title,
        description,
        duration: videoRef.duration,
        owner: req.user._id,
        publicId: videoRef.public_id
    })
    
    return res
    .status(201)
    .json(new ApiResponse(200, video ,"video uploaded successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!videoId){
        throw new ApiError(404, "Video id is required")
    }

    const video = await Video.findById(videoId).populate("owner", "username avatar").exec();

    if(!video){
        throw new ApiError(400, "Invalid videoId or video does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if (!videoId) {
        throw new ApiError(404, "videoId is required");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.ACCESS_TOKEN_SECRET);

    if (video.owner.toString() !== decodedToken._id) {
        throw new ApiError(403, "You do not have permission to update this video");
    }

    const { title, description } = req.body;
    let updateData = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;

    if (req.files?.thumbnail?.[0]?.path) {
        const thumbnailRef = await uploadOnCloudinary(req.files.thumbnail[0].path);
        if (thumbnailRef && thumbnailRef.secure_url) {
            updateData.thumbnail = thumbnailRef.secure_url;
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true }
    );

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found or update failed");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if (!videoId) {
        throw new ApiError(404, "videoId is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found or already deleted");
    }

    const incomingRefreshToken = await req.cookies.refreshToken || req.body.refreshToken;
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.ACCESS_TOKEN_SECRET);

    if(!(decodedToken._id !== videoId)){
        throw new ApiError(401, "You don't have access to delete this video")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);
    const deletedOnCloudnary = await cloudinary.uploader.destroy(video.publicId,{resource_type: "video"})

    console.log("respone of deletededOnclo.. video ===> ",deletedOnCloudnary); // Todo check the response
    console.log("respone of deletedVideo video ===> ",deletedVideo); // Todo check the response
    
    if (!deletedVideo ) {
        throw new ApiError(404, "Video not found or already deleted");
    }

    if(deletedOnCloudnary.result !== "ok"){
        throw new ApiError(501, "video not deleted from cloudinary or video does not exist in cludinary")
    }

    deleteVideo.deletedOnCloudnary = deletedOnCloudnary;

    return res
        .status(200)
        .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(404, "videoId is required");
    }

    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.ACCESS_TOKEN_SECRET);

    if (video.owner.toString() !== decodedToken._id) {
        throw new ApiError(403, "You do not have permission to toggle publish status of this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`));
})

const addView = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(404, "videoId is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    video.views = video.views + 1;
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { views: video.views }, "View count incremented"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    addView
}
