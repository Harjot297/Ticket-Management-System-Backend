import express from 'express'
import { globalCache } from '../helpers/redisCache';

export const cacheNearbyTheatres = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try{
        const lat = req.query.lat as string || '';
        const lng = req.query.lng as string || '';
        const radius = req.query.radius as string || ''; // in km
        if (!lat || !lng || !radius) {
            console.warn('Cache skipped: Missing lat/lng/radius in nearby theatres request.');
            return next();
        }

        const key = `theatres:nearbyTheatres:lat=${lat}|lng=${lng}|radius=${radius}`;
        const cacheMiddleware = globalCache(key, 120);
        return cacheMiddleware(req, res, next);
    }
    catch(err: any){
        console.log('Error caching nearby theatres : ', err);
        next(err);
    }
}