import express from 'express';
import mongoose from 'mongoose';
import Hall from '../../schemas/Hall';
import Theatre from '../../schemas/Theatre';
import redisClient from '../../redisClient';
import { delPattern } from '../../helpers/redisCache';
import Show from '../../schemas/Show';

export const toggleHallStatus = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { hallId } = req.params;

    if (!hallId) {
      res.status(400).json({ success: false, message: "Hall ID is required" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      res.status(400).json({ success: false, message: "Invalid Hall ID" });
      return;
    }

    const hall = await Hall.findById(hallId);
    if (!hall) {
      res.status(404).json({ success: false, message: "Hall not found" });
      return;
    }

    const theatre = await Theatre.findById(hall.theatreId);
    if (!theatre) {
      res.status(404).json({ success: false, message: "Theatre not found" });
      return;
    }

    if (req.user.role !== "admin" && req.user.userId.toString() !== theatre.owner.toString()) {
      res.status(403).json({ success: false, message: "Unauthorized to update this hall status" });
      return;
    }

    hall.isActive = !hall.isActive;
    await hall.save();

    try {
      await redisClient.del(`erc:theatre:halls:${hall.theatreId}`);
      await redisClient.del(`erc:hall:details:${hall._id}`);
      await redisClient.del(`erc:theatre:details:${hall.theatreId}`);
      await redisClient.del(`erc:theatre:${theatre.owner}`);
      await redisClient.del(`erc:theatres:active`);
      await redisClient.del(`erc:theatre:6873d5c2e576d0b55a8332d9`); // Admin cache
      const keys = await redisClient.keys('erc:halls:all:*');
      if (keys.length > 0) await redisClient.del(keys);
      const seatKeys = await redisClient.keys(`erc:hall:seats:${hall._id}:*`);
      if (seatKeys.length > 0) await redisClient.del(seatKeys);
      await delPattern("erc:shows:movie:*");
      await delPattern("erc:shows:theatre:*");
      // fetch all shows associated with this hall and invalidate their cache
      const shows = await Show.find({ hallId: hall._id });
      for (const show of shows) {
        await redisClient.del(`erc:show:details:${show._id}`);
      }
      await delPattern("erc:bookings:user:*");
      await delPattern("erc:bookings:*");
      await delPattern("erc:bookings:show:*");
    } catch (e) {
      console.warn("Cache invalidation failed:", (e as Error).message);
    }

    res.status(200).json({
      success: true,
      message: `Hall is now ${hall.isActive ? "active" : "inactive"}`,
      data: hall
    });
    return;
  } catch (err: any) {
    console.error("Error toggling hall status:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
    return;
  }
};
