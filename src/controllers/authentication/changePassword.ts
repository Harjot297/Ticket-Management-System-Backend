import express from 'express'
import User from '../../schemas/User';
import {hashPassword , randomString} from '../../helpers/index'
import redisClient from '../../redisClient';

export const changePassword = async (req: express.Request , res: express.Response ) : Promise<void> => {
    try{
        // get password , newPassword , confirmNewPassword from req body
        const {password , newPassword , confirmNewPassword} = req.body;
        if(!password || !newPassword || !confirmNewPassword){
            res.status(400).json({
                message: "Fields password , newPassword or confirmNewPassword missing"
            })
            return;
        }        

        if(newPassword !== confirmNewPassword){
            res.status(404).json({
                message: "New Passwords doesnt match"
            })
            return;
        }
        if (password === newPassword) {
            res.status(400).json({
                message: "New password cannot be the same as the old password"
            });
            return;
        }
        // find corresponding user
        const user = await User.findById(req.user.userId).select('+authentication.password +authentication.salt +authentication.sessionId');
        if(!user){
            res.status(404).json({
                message : "User not found , Invalid UserId or AccessToken"
            })
            return;
        }

        const originalSalt = user.authentication.salt;
        const hashPrevPassword = hashPassword(originalSalt , password);

        if(hashPrevPassword !== user.authentication.password){
            res.status(400).json({
                message : "Incorrect Password"
            })
            return;
        }

        // means correct password
        const newSalt = randomString();
        const newHashedPassword = hashPassword(newSalt,newPassword);
        user.authentication.salt = newSalt;
        user.authentication.password = newHashedPassword;
        // NOTE: Forced Relogin on password change
        
        await redisClient.set(`bl:${user.authentication.sessionId}`, "true", { EX: 60 * 15 }); // Blacklist old accessToken if needed
        user.authentication.sessionId = undefined;

        await user.save();

        res.clearCookie('refreshToken' , {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        })


        res.status(200).json({
            message: "Password changed successfully , Please login again"
        })
        return;

        
    }
    catch(err: any){
        console.log('Error : ' , err);
        res.status(500).json({
            message : "Internal Server Error , Failed to change Password"
        })
        return;
    }
}