import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../../schemas/User';
import redisClient from '../../redisClient';
import { accessTokenPayload, refreshTokenPayload } from '../../interfaces/tokenPayloads';

require("dotenv").config();

export const resetAccessToken = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        message: "No refresh token provided. Please log in again.",
      });
      return;
    }

    let decoded: refreshTokenPayload;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET) as refreshTokenPayload;
    } catch (err: any) {
      res.status(403).json({
        message: "Invalid or expired refresh token. Please log in again.",
      });
      return;
    }

    const { userId, sessionId } = decoded;

    // Check user and validate sessionId
    const user = await User.findById(userId).select('+authentication.sessionId');
    if (!user || user.authentication.sessionId !== sessionId) {
      res.status(403).json({
        message: "Invalid session. Please log in again.",
      });
      return;
    }

    // Invalidate old sessionId from previous access token (if needed)
    // Optional: You may check req.user.sessionId if you send access token with request
    // But here, we skip because access token might already be expired (why we are refreshing)

    // Generate new access token
    const accessPayload: accessTokenPayload = {
      userId: user._id,
      sessionId: sessionId,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = jwt.sign(accessPayload, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    // // You could optionally blacklist previous access token here (if provided):
    // const oldAccessToken = req.headers.authorization?.split(" ")[1] || req.body.accessToken;
    // if (oldAccessToken) {
    //   const oldDecoded = jwt.decode(oldAccessToken) as jwt.JwtPayload;
    //   const oldSessionId = oldDecoded?.sessionId;
    //   if (oldSessionId) {
    //     await redisClient.set(`bl:${oldSessionId}`, 'true', { EX: 60 * 15 }); // 15 min
    //   }
    // }

    // Return new access token
    res.status(200).json({
      accessToken: newAccessToken,
      message: "Access token refreshed successfully.",
    });
    return;

  } catch (err) {
    console.error("Error in resetAccessToken:", err);
    res.status(500).json({
      message: "Internal Server Error. Unable to refresh access token.",
    });
    return;
  }
};
