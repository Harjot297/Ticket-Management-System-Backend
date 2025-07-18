import { Request, Response, NextFunction } from "express";
const cache = require("express-redis-cache")();

// Export a function called userScopedCache that takes a routeKey as a parameter
export const userScopedCache = (routeKey: string) => {
  // Return a function that takes a request, response, and next function as parameters
  return (req: Request, res: Response, next: NextFunction) => {
    // Get the userId from the request object, or set it to "guest" if it doesn't exist
    const userId = (req as any).user?.userId || "guest";
    // Generate a key using the routeKey and userId
    const key = `${routeKey}:${userId}`;
    // Log the generated key
    console.log("🔑 Cache key generated AFTER auth:", key);

    // Create a cachingMiddleware using the generated key
    const cachingMiddleware = cache.route({ name: key });
    // Return the cachingMiddleware function
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