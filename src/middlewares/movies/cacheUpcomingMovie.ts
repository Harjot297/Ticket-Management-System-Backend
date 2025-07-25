import { Request , Response , NextFunction } from "express";
import { globalCache } from "../../helpers/redisCache";

export const cacheUpcomingMovie = (req: Request, res: Response , next : NextFunction) => {
    try{
        const key = "movies:upcoming";
        const cacheMiddleware = globalCache(key , 1200);
        return cacheMiddleware(req,res,next);
    }
    catch(err : any){
        console.log("[Redis Cache] Error in cacheUpcomingMovie middleware: " , err);
        next(err);
    }
}