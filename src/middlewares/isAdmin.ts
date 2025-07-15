import express from "express";

export const isAdmin = async (req: express.Request , res: express.Response, next: express.NextFunction) : Promise<void> => {
    try{
        if(!req.user){
            res.status(401).json({
                message: "Unauthorized access, user not authenticated"
            })
            return;
        }
        const user = req.user;

        if(user.role !== "admin"){
            res.status(403).json({
                message: "Forbidden access, admin role required"
            })
            return;
        }

        next();
    }
    catch(err: any){
        console.log("Error in isAdmin middleware:", err);
        res.status(500).json({
            message: "Internal server error in isAdmin middleware"
        });
        return;
    }
}