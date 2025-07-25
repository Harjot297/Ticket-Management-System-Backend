import { Request, Response, NextFunction } from "express";
const cache = require("express-redis-cache")();
import redisClient from "../redisClient";

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

// Making a global cache to cache global changes
export const globalCache = (routeKey: string , ttl: Number = 60) => {
  return ( req: Request , res: Response , next : NextFunction) => {
    const cachingMiddleware = cache.route({name: routeKey , ttl : ttl});
    return cachingMiddleware(req,res,next);
  }
} 

/*
  NOTE: userScopedCache → Used only when the response depends on the specific logged-in user.
  Example: /theatre/my-theatre (each theatre owner sees only their own theatre).

  NOTE: globalCache (with route-based keys like erc:theatres:active or erc:theatre:details:<theatreId>) → Used for public routes where the response is the same for all users.
  Example: /theatres/active or /theatres/:theatreId/details.
*/ 

/**
 * Deletes all keys matching a pattern from Redis.
 * ⚠️ Uses KEYS internally – use with caution in production-scale datasets.
 */
export const delPattern = async (pattern: string): Promise<void> => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        for (const key of keys) {
          await redisClient.del(key);
        }
        console.log(`Deleted ${keys.length} keys for pattern: ${pattern}`);
      }
    } catch (err) {
      console.error(`Error deleting keys with pattern "${pattern}":`, err);
    }
};
