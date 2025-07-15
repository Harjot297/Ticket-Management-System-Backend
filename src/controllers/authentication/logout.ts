import express from "express"
import User from "../../schemas/User";
import redisClient from "../../redisClient"

export const logout = async (req: express.Request , res : express.Response) : Promise<void> => {
    try{        
        // get userId from request
        const userId = req.user?.userId;
        // check whther valid user exists
        if(!userId){
            res.status(400).json({
                message : "Invalid request. No userId found in token."
            })
            return;
        }
        // fetch user
        const user = await User.findById({_id: userId}).select('+authentication.sessionId');

        if (!user) {
            res.status(404).json({
                message: "User not found.",
            });
            return;
        }

        if(!user.authentication?.sessionId){
            res.status(404).json({
                message : "Session not found for user."
            })
            return;
        }

        // Blacklist the access key so that it cant be used
        await redisClient.set(`bl:${user.authentication.sessionId}`, "true", { EX: 60 * 15 }); // 15 min

        /*
            NOTE: If Redis Client gives error configured to save RDB snapshots, but is currently not able to persist on disk
            RUN following commands on redis client 
            redis-cli
            > CONFIG SET save ""
            > CONFIG SET stop-writes-on-bgsave-error no
        */

        // user session found
        user.authentication.sessionId = undefined;
        await user.save();

        // invalidate the cookie 
        res.clearCookie('refreshToken' , {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        })

        

        res.status(200).json({
            message: "Logout Successfully"
        })
        return;
    }
    catch(err : any){
        console.log(err);
        res.status(500).json({
            message : "Internal Server Error. Unable to logout"
        })
        return;
    }
}