import { Request, Response, NextFunction } from "express";
import { globalCache } from "../../helpers/redisCache";

export const cacheMovieSearch = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const title = (req.query.title as string) || "";
    const genre = (req.query.genre as string) || "";

    const key = `erc:movies:search:title=${title.toLowerCase()}|genre=${genre.toLowerCase()}`;
    const cachingMiddleware = globalCache(key, 600); // 10 min TTL
    return cachingMiddleware(req, res, next);
  } catch (err: any) {
    console.error("Error in cacheMovieSearch middleware:", err);
    next(err);
  }
};
