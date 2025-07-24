import express from 'express'
import { globalCache } from '../helpers/redisCache';
export const cacheHallDetails = (req: express.Request , res: express.Response , next: express.NextFunction) =>{
    try{
        const {hallId} = req.params;
        const middleware = globalCache(`hall:details:${hallId}`);
        console.log("🔑 Cache key generated Hall Details:", `hall:details:${hallId}`);
        return middleware(req,res,next);
    }
    catch(err: any){
        console.log("Error caching hall details : " , err);
        next(err);
    }
}