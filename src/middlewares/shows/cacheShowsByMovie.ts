import { Request , Response , NextFunction } from "express";
import { globalCache } from "../../helpers/redisCache";

export const cacheShowsByMovie = (req: Request , res: Response , next: NextFunction ) => {
    try{
        const { movieId } = req.params;
        const { language, format, date , days }  = req.query;
        const key = `erc:shows:movie:${movieId}|lang=${language || ''}|format=${format || ''}|date=${date || ''}|days=${days || '1'}`;


        const cachingMiddleware = globalCache(key,120);
        return cachingMiddleware(req,res,next);
    }
    catch(err : any){
        console.log("Error caching shows by movie: " , err);
        next(err);
    }
}