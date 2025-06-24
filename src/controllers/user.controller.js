import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validtion - not empty
    // check if user already exists: username or email
    // check for images check for avatar 
    // upload them to cloudinary, avatar
    // creat user object - creat entery in db
    // remove password and refresh token field in response
    // check for user creation 
    // return res


    const { fullName, email, username, password } = req.body
    

    if (fullName === "") {
        throw new ApiError(400,"Full name is required")
    }
    if (username === "" || username === null) {
        throw new ApiError(400,"username is required")
    }
    if (password === "") {
        throw new ApiError(400,"password is required")
    }
    if (email === "" || email === null) {
        throw new ApiError(400,"email is required")
    }


    const existedUser = await User.findOne({$or:[ { username }, { email } ]})
    

    if(existedUser){
        throw new ApiError(409,"This user is already exists !!")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400,"avatar file is required")
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

    if(!createdUser){
        throw new ApiError("500", "Something went wrong while registering the user")
    }

    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully!"))

})

const loginUser = asyncHandler(async (req, res) => {
    //get data from body 
    const {email, username, password} = req.body;

    if(!username || !email){
        throw new ApiError(400,"email or username are required");
    }

    //get user from db using email or username
    const user = await User.findOne({
        $or:[{email}, {username}]
    })

    if (!user) {
        throw new ApiError(404,"user is doest not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (isPasswordValid) {
        throw new ApiError(401,"user cradantials are not valid");
    }

    //compare the password using bcrypt
    //if correct give access token and refresh token
    //send cookie
})

export {registerUser, loginUser}