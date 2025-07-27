import {Request, Response, NextFunction} from 'express'
import { globalCache } from '../../helpers/redisCache';


export const cacheShowsByTheatre = async (req: Request , res: Response , next: NextFunction) => {
    try{
        const { theatreId } = req.params;
        const { language, format, date , days }  = req.query;
        const key = `erc:shows:theatre:${theatreId}|lang=${language || ''}|format=${format || ''}|date=${date || ''}|days=${days || '1'}`;

        const cachingMiddleware = globalCache(key,120);
        return cachingMiddleware(req,res,next);
    }
    catch(err : any){
        console.log("Error caching shows by theatre: " , err);
        next(err);
    }
}