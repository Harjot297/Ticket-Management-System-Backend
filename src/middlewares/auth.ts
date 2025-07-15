require("dotenv").config();
import jwt from "jsonwebtoken";
import express from "express";
import { accessTokenPayload } from "interfaces/tokenPayloads";
import redisClient from "../redisClient";

// better type safety for the payloads of the tokens

export const auth = async (req: express.Request , res: express.Response , next : express.NextFunction) : Promise<void> => {
    try{
        const accessToken = req.headers.authorization?.split(" ")[1];
        // My acceessToken will be in request header as Bearer token 
        /*
            Example :
            fetch("https://your-backend.com/api/protected", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            })
            So , we will check if accessToken is present in the request header or body
            If not present , we will return 401 Unauthorized
        */
        // This also ensures that the user is authenticated before accessing protected routes
        if(!accessToken){
            res.status(401).json({
                message: "Access token expired , please call refresh token endpoint to get a new access token if you have a refresh token"
            })
            return;
        }

        const decode = jwt.verify(accessToken,process.env.JWT_SECRET) as accessTokenPayload;
        if(!decode){
            res.status(401).json({
                message: "Invalid access token"
            })
            return;
        }
        // IF blacklisted , we send invalid access token response
        const isBlacklisted = await redisClient.get(`bl:${decode.sessionId}`);

        if(isBlacklisted){
            res.status(401).json({
                message: "The access token is Blacklisted . Please login again"
            })
        }

        if(req.user){
            req.user = null; // Clear previous user data if any
        }
        // If the access token is valid, we can attach the userId to the request object
        req.user = decode; // This will contain userId, sessionId, email, role
        // You can also attach the userId to req.user if you prefer
        
        // For now If you want to get role in any controller, you can access it like this
        // req.user.role
        next(); // Call the next middleware or controller
    }
    catch(err : any){
        console.error("JWT Error:", err);

        if (err.name === "TokenExpiredError") {
            res.status(401).json({
                message: "Access token expired. Please refresh.",
            });
            return;
        }

        res.status(401).json({
            message: "Invalid access token.",
        });
        return;
    }
}