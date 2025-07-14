require("dotenv").config();
import jwt from "jsonwebtoken";
import express from "express";

// better type safety for the payloads of the tokens
interface AccessTokenPayload {
  userId: string;
  sessionId: string;
  email: string;
  role: 'admin' | 'theatreOwner' | 'normalUser';
}

export const auth = async (req: express.Request , res: express.Response , next : express.NextFunction) : Promise<void> => {
    try{
        const accessToken = req.headers.authorization?.split(" ")[1] || req.body.accessToken;
        // My acceessToken will be in request header as Bearer token or in body as accessToken
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

        const decode = jwt.verify(accessToken,process.env.JWT_SECRET) as AccessTokenPayload;
        if(!decode){
            res.status(401).json({
                message: "Invalid access token"
            })
            return;
        }
        // If the access token is valid, we can attach the userId to the request object
        (req as any).user = decode; // This will contain userId, sessionId, email, role
        // You can also attach the userId to req.user if you prefer
        
        // For now If you want to get role in any controller, you can access it like this
        // req.user.role
        next(); // Call the next middleware or controller
    }
    catch(err){
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