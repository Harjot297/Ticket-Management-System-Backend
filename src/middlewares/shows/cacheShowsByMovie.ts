import { Request , Response , NextFunction } from "express";
import { globalCache } from "../../helpers/redisCache";

export const cacheShowsByMovie = (req: Request , res: Response , next: NextFunction ) => {
    try{
        const { movieId } = req.params;
        if (!movieId || typeof movieId !== 'string') {
           return next(new Error('Invalid movieId parameter'));
       }
        const { language, format, date , days }  = req.query;
        const sanitizedLanguage = typeof language === 'string' ? language.trim() : '';
        const sanitizedFormat = typeof format === 'string' ? format.trim() : '';
        const sanitizedDate = typeof date === 'string' ? date.trim() : '';
        const sanitizedDays = typeof days === 'string' ? days.trim() : '1';

        const key = `erc:shows:movie:${movieId}|lang=${sanitizedLanguage}|format=${sanitizedFormat}|date=${sanitizedDate}|days=${sanitizedDays}`;


        const cachingMiddleware = globalCache(key,120);
        return cachingMiddleware(req,res,next);
    }
    catch(err : any){
        console.log("Error caching shows by movie: " , err);
        next(err);
    }
}