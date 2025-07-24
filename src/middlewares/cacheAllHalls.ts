import express from 'express'
import { globalCache } from '../helpers/redisCache';

export const cacheAllHalls = async (req : express.Request, res : express.Response , next : express.NextFunction): Promise<void> => {
    try{
        const page = req.query.page || '1';
        const pageSize = req.query.pageSize || '10';

        const key = `halls:all:page=${page}|size=${pageSize}`;

        const cacheMiddleware = globalCache(key,120);
        return cacheMiddleware(req,res,next);
    }
    catch(err : any){
        console.log("🔑 Cache key failed to generate : " , err);
        next(err);
    }
}