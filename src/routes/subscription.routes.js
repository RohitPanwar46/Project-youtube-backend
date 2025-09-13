import { Router } from 'express';
import {
    getUserSubscribedChannels,
    getChannelSubscribers,
    toggleSubscription,
    getAllChannels
} from "../controllers/subscription.controller.js"
import {verifyJwt} from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/c/:channelId").get(getChannelSubscribers)
router.route("/all/channels").get(getAllChannels)

router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .post(toggleSubscription);

router.route("/u/:subscriberId").get(getUserSubscribedChannels);

export default router