import express from 'express'
import { globalCache } from '../../helpers/redisCache'

export const cacheAllAdminMovie = async (req : express.Request , res: express.Response , next: express.NextFunction) => {
    try{
        const page = req.query.page || '1'; 
        const pageSize = req.query.pageSize || '10';

        const key = `movies:all:admin:page=${page}|size=${pageSize}`;
        
        const cachingMiddleware = globalCache(key , 120);
        return cachingMiddleware(req,res,next);
    }
    catch(err: any){
        console.log("Error in cacheAllAdminMovie middleware: " , err);
        next(err);
    }
}