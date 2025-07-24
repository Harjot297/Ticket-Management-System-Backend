import express from 'express';
import { globalCache } from '../helpers/redisCache';

export const cacheHallSeats = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const { hallId } = req.params;
    const available = req.query.available !== undefined ? req.query.available : 'all';

    const key = `hall:seats:${hallId}:available=${available}`;
    const cacheMiddleware = globalCache(key, 120); // 120 seconds cache

    return cacheMiddleware(req, res, next);
  } catch (err: any) {
    console.log('Error caching hall seats: ', err);
    next(err);
  }
};
