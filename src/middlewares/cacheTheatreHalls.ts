import express from 'express';
import { globalCache } from '../helpers/redisCache';

export const cacheTheatreHalls = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { theatreId } = req.params;
    if (!theatreId) return next();

    const key = `theatre:halls:${theatreId}`;
    const cacheMiddleware = globalCache(key, 120); // Cache for 2 minutes
    return cacheMiddleware(req, res, next);
  } catch (err: any) {
    console.log("Error in cacheTheatreHalls middleware:", err);
    next();
  }
};
