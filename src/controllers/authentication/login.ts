import express from 'express';
import User from '../../schemas/User';
import { hashPassword } from '../../helpers/index';
import mongoose from 'mongoose';
import jwt , {SignOptions} from 'jsonwebtoken';
import {accessTokenPayload , refreshTokenPayload} from "../../interfaces/tokenPayloads"
import { delPattern } from '../../helpers/redisCache';
require("dotenv").config();


export const login = async (req: express.Request , res: express.Response) : Promise<void> => {
    try{
        const backendServerIdentifier = req.headers['x-backend-server'];
        const {email , password } = req.body;

        if(!email || !password){
            res.status(400).json({
                message: "Please provide email and password"
            })
            return;
        }
        // Check if user exists
        const userExists = await User.findOne({
            email : email.toLowerCase()
        }).select('+authentication.password +authentication.salt +authentication.sessionId');

        if(!userExists){
            res.status(400).json({
                message: "User does not exist , Please SignUp"
            })
            return;
        }
        // get salt 
        const salt = userExists.authentication.salt;
        // User exists , now password checking

        const hashedPassword = hashPassword(salt, password);

        if(hashedPassword !== userExists.authentication.password){
            res.status(400).json({
                message: "Invalid password"
            })
            return;
        }

        // now password is correct , so we can create a sessionId
        const sessionId = hashPassword(salt, `${userExists._id}${Date.now()}`);
        // update the user with the sessionId
        userExists.authentication.sessionId = sessionId;
        await userExists.save();

        // Create two tokens --> access token and refresh token
        // Access token will be used to access protected routes
        // Refresh token will be used to refresh the access token

        // For type safety, we can define interfaces for the payloads of the tokens

        const refreshTokenBody : refreshTokenPayload = {
            userId: userExists._id,
            sessionId: sessionId,
        }
        const accessTokenBody : accessTokenPayload = {
            userId: userExists._id,
            sessionId: sessionId,
            email: userExists.email,
            role: userExists.role, // Optional, if you want to include role in access token
            
        }

        const accessTokenOptions: SignOptions = { expiresIn: '15m' };
        const refreshTokenOptions: SignOptions = { expiresIn: '7d' };

        const refreshToken = jwt.sign(
            refreshTokenBody as refreshTokenPayload,
            process.env.JWT_SECRET,
            refreshTokenOptions
        );

        const accessToken = jwt.sign(
            accessTokenBody as accessTokenPayload,
            process.env.JWT_SECRET,
            accessTokenOptions
        );

        // My Whole Flow if frontend tries to call any protected route
        /*
            User → calls protected route
                    ↓
            Backend checks access token
                    ↓
            ✅ Valid → return data
                    ↓
            ❌ 401 Unauthorized
                    ↓
            Frontend → calls /auth/refresh
                    ↓
            ✅ Refresh OK → retry original route with new accessToken
                    ↓
            ❌ Refresh FAIL → logout user and show login required 
        */

        res.cookie('refreshToken' , refreshToken , {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        try{
            await delPattern("erc:bookings:show:*");
        }
        catch(err: any){
            console.log("Error in cache invalidation:", err);
        }

        res.status(200).json({
            accessToken: accessToken,
            message: "Login Successful",
            user: {
                id: userExists._id,
                name: userExists.name,
                email: userExists.email,
                role: userExists.role,
            },
        })
        return;

    }
    catch(err){
        res.status(500).json({
            message: "Internal Server Error"
        })
        return;
    }
}