import {Request, Response, NextFunction} from 'express'
import { globalCache } from '../../helpers/redisCache';


export const cacheShowsByTheatre = async (req: Request , res: Response , next: NextFunction) => {
    try{
        const { theatreId } = req.params;
        const { language, format, date , days }  = req.query;

        if (!theatreId || typeof theatreId !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Invalid theatreId parameter"
            });
        }
        
        // Ensure query params are strings or undefined
        const langStr = typeof language === 'string' ? language : '';
        const formatStr = typeof format === 'string' ? format : '';
        const dateStr = typeof date === 'string' ? date : '';
        const daysStr = typeof days === 'string' ? days : '1';

        const key = `erc:shows:theatre:${theatreId}|lang=${langStr}|format=${formatStr}|date=${dateStr}|days=${daysStr}`;

        const cachingMiddleware = globalCache(key,120);
        return cachingMiddleware(req,res,next);
    }
    catch(err : any){
        console.log("Error caching shows by theatre: " , err);
        next(err);
    }
}