import express from 'express'
import { globalCache } from '../helpers/redisCache';

export const cacheTheatreId = (req: express.Request , res: express.Response , next: express.NextFunction) => {
    try{
        const theatreId = req.params.theatreId;
        const middleware = globalCache(`theatre:details:${theatreId}`);
        return middleware(req, res, next); // Execute the middleware returned by globalCache
    }
    catch(err: any){
        console.log('Error caching route (/theatre/:theatreId/details) : ', err);
        next(err);
    }
}