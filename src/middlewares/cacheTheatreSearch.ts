import express from 'express'
import { globalCache } from '../helpers/redisCache';

export const cacheTheatreSearch = (req : express.Request , res: express.Response , next: express.NextFunction) => {
    try{
        const city = req.query.city || '';
        const name = req.query.name || '';
        const key = `theatres:search:city=${city.toString().toLowerCase()}|name=${name.toString().toLowerCase()}`; 
        const cachingMiddleware =  globalCache(key,120);   
        return cachingMiddleware(req,res,next);
    } 
    catch(err : any){
        console.log('Error caching theatre search')
        next(err);
    }
}