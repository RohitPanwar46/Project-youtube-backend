import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";



const registerUser = asyncHandler(async (req, res, next) => {
    console.log("Register route hit");

    const { fullName, email, username, password } = req.body

    if (!fullName || fullName === "") {
        throw new ApiError(400, "Full name is required")
    }
    if (!username || username === "") {
        throw new ApiError(400, "username is required")
    }
    if (!password || password === "") {
        throw new ApiError(400, "password is required")
    }
    if (!email || email === "") {
        throw new ApiError(400, "email is required")
    }
    // Check if username already exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
        throw new ApiError(409, "Username is already taken");
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
        throw new ApiError(409, "Email is already registered");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError("500", "Something went wrong while registering the user")
    }

    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully!"))
})

const generateRefreshAndAccessToken = async (userId) => {
    try {
        if (!userId) {
            throw new ApiError(501, "user id did not passed")
        }

        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(401, "user not found may be userId is incorrect or not found")
        }

        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        if (!accessToken) {
            throw new ApiError(500, "did not get access token")
        }
        if (!refreshAccessToken) {
            throw new ApiError(500, "did not get refresh token")
        }
        

        user.refreshToken = refreshToken;
        
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const loginUser = asyncHandler(async (req, res) => {
    //get data from body 
    const {email, username, password} = await req.body;
    

    if(!username && !email){
        throw new ApiError(400,"email or username are required");
    }

    //get user from db using email or username
    const user = await User.findOne({
        $or:[{email}, {username}]
    })

    if (!user) {
        throw new ApiError(404,"user is doest not exist");
    }

    //compare the password using bcrypt
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401,"user cradantials are not valid");
    }

    //if correct give access token and refresh token
    const {accessToken, refreshToken} = await generateRefreshAndAccessToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken").lean();

    //send cookie
    const options = {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser,
            refreshToken,
            accessToken
        },"user logged in successfully")
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {refreshToken: 1},
        },
        {
            new: true
        }
    )
    
    const options = {
        httpOnly: true,
        secure: false
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json( new ApiResponse(200, {}, "User logged out successfully"))
    
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unothorized request");
    }

    const decodedToken = jwt.verify(incomingRefreshToken,process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id);

    if(!user){
        throw new ApiError(401,"Invalid refreshToken");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401,"refreshToken invalid or expired");
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const {accessToken, refreshToken} = await generateRefreshAndAccessToken(decodedToken?._id);

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,{accessToken, refreshToken}, "Tokens are refreshed")
    )
})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    if (!oldPassword) {
        throw new ApiError(401, "old password is missing")
    }

    if (!newPassword) {
        throw new ApiError(401, "new password is missing")
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(401, "invalid user id");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "wrong old password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "password updated successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body;

    if (!fullName || !email) {
        throw new ApiError(401, "all fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "error while uploading avatar on cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400, "cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(400, "error while uploading coverImage on cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                subscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [
                                req.user?._id,
                                {
                                    $map: {
                                        input: "$subscribers",
                                        as: "sub",
                                        in: "$$sub.subscriber"
                                    }
                                }
                            ]
                        },
                        then: true,
                        else: false
                    }
}
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if (!channel.length) {
        throw new ApiError(404, "channel does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "user channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])


    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}