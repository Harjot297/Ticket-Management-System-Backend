import express from 'express'
import { globalCache } from '../../helpers/redisCache'

export const cacheAllMoviesPublic = async (req : express.Request , res: express.Response , next: express.NextFunction) => {
    try{
        const page = String(req.query.page) || '1'; 
        const pageSize = String(req.query.pageSize) || '10';
        const genre = String(req.query.genre) || '';
        const language = String(req.query.language) || '';

        const key = `movies:all:public:page=${page}|size=${pageSize}|genre=${genre}|language=${language}`;
        
        const cachingMiddleware = globalCache(key , 120);
        return cachingMiddleware(req,res,next);
    }
    catch(err: any){
        console.log("Error in cacheAllMoviesPublic middleware: " , err);
        next(err);
    }
}