import { Request, Response, NextFunction } from "express";
const cache = require("express-redis-cache")();

export const userScopedCache = (routeKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.userId || "guest";
    const key = `${routeKey}:${userId}`;
    console.log("🔑 Cache key generated AFTER auth:", key);

    const cachingMiddleware = cache.route({ name: key });
    return cachingMiddleware(req, res, next); // run actual redis-cache after key is generated
  };
};

/*
    NOTE: cache.route() method returns us with a middleware 
    IF we directly return cache.route({name:key}) , userId is set to undefined , because
    this cache.route() middleware if passed directly runs whenever our Express router mounts
    and at that time auth middleware didnt ran .
    Now, in the above way , we return a middleware which then calls and return the cache.router({name:key})
    SO, now this middleware will run after auth middleware ensuring it doesnt runs when 
    Express router mounts and run only on *Request* and that too after auth middleware thus populating user
    in request;
*/