import { Request , Response , NextFunction } from "express";
import { globalCache } from "../../helpers/redisCache";

export const cacheSpecificBooking = async (req: Request , res: Response , next: NextFunction) => {
    try{
        const {bookingId} = req.params;
        const key = `erc:bookings:${bookingId}`;
        const cachingMiddleware = globalCache(key, 120); // 120  seconds TTL
        console.log("🔑 Cache key generated for specific booking:", key)
        return cachingMiddleware(req, res, next); // run actual redis-cache after key is generated
    }
    catch(err: any){
        console.error("❌ Error in cacheSpecificBooking middleware:", err);
        next(err);
    }
}