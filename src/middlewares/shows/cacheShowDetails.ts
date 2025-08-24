import { Request , Response , NextFunction } from "express";
import { globalCache } from "../../helpers/redisCache";

export const cacheShowDetails = async (req: Request , res: Response , next: NextFunction) => {
    try{
        const showId = req.params.showId;
        if(!showId){
            return next(new Error('Invalid showId parameter'));
        }
        const key = `erc:show:details:${showId}`;
        const cachingMiddleware = globalCache(key,120);
        return cachingMiddleware(req,res,next);
    }
    catch(err: any){
        console.log("Error caching show details : " , err);
        next(err);
    }
}