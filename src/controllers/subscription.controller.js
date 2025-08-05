import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


// Toggle subscription for a user to a channel
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    if (userId.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: userId
    });

    let subscribed;
    if (existingSubscription) {
        await existingSubscription.deleteOne();
        subscribed = false;
    } else {
        await Subscription.create({
            channel: channelId,
            subscriber: userId
        });
        subscribed = true;
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { subscribed }, subscribed ? "Subscribed" : "Unsubscribed"));
});

// Controller to return subscriber list of a channel
const getChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username avatar")
        .lean();

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
});

// Controller to return channel list to which user has subscribed
const getUserSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId");
    }

    const channels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username avatar")
        .lean();

    return res
        .status(200)
        .json(new ApiResponse(200, channels, "Subscribed channels fetched successfully"));
});

export {
    toggleSubscription,
    getChannelSubscribers,
    getUserSubscribedChannels
}