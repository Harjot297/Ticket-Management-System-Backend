import { Request, Response, NextFunction } from "express";
import { globalCache } from "../../helpers/redisCache";

export const cacheSingleMovie = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { movieId } = req.params;

    // Optional: You can validate ObjectId here too if needed

    const cacheKey = `erc:movie:detail:${movieId}`;
    const cacheMiddleware = globalCache(cacheKey, 1200); // 20 min TTL
    return cacheMiddleware(req, res, next);
  } catch (err: any) {
    console.error("Error caching single movie:", err);
    next(err);
  }
};
