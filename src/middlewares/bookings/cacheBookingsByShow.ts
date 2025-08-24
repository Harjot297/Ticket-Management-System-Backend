import { Request, Response, NextFunction } from "express";
import { globalCache } from "../../helpers/redisCache";

// 🔐 Caches bookings for a specific showId
export const cacheBookingsByShow = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { showId } = req.params;
        const key = `erc:bookings:show:${showId}`;
        const cachingMiddleware = globalCache(key, 120); // TTL = 120 seconds
        console.log("🔑 Cache key generated for bookings by show:", key);
        return cachingMiddleware(req, res, next); // Delegate to actual caching logic
    } catch (err: any) {
        console.error("❌ Error in cacheBookingsByShow middleware:", err);
        next(err);
    }
};
