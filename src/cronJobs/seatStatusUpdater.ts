import cron from "node-cron";
import redisClient from "../redisClient";
import Seat from "../schemas/Seat";

export const seatStatusUpdater = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      // Step 1: Find all affected seats
      const affectedSeats = await Seat.find(
        {
          selectedByUser: {$ne: null},
          selectedAt: { $lte: fifteenMinutesAgo },
        },
        "hallId _id"
      );

      if (affectedSeats.length === 0) return;

      // Step 2: Update seat statuses
      const seatIds = affectedSeats.map((seat) => seat._id);
      const updateResult = await Seat.updateMany(
        { _id: { $in: seatIds } },
        {
          $set: {
            selectedByUser: null,
            selectedAt: null,
          },
        }
      );

      // Step 3: Log and invalidate cache
      const hallIdMap: Record<string, boolean> = {};
      const uniqueHallIds: string[] = [];

      for (const seat of affectedSeats) {
        const hallIdStr = String(seat.hallId);
        if (!hallIdMap[hallIdStr]) {
          hallIdMap[hallIdStr] = true;
          uniqueHallIds.push(hallIdStr);
        }
      }

      console.log(
        `🪑 Seat status updated for ${updateResult.modifiedCount} seats.`
      );
      console.log(`🏢 Halls affected: ${uniqueHallIds.join(", ")}`);

      for (const hallId of uniqueHallIds) {
        try {
          await redisClient.del(`erc:hall:details:${hallId}`);
          console.log(`🧹 Cache invalidated for hall: ${hallId}`);
        } catch (err: any) {
          console.error(`❌ Error invalidating cache for hall ${hallId}:`, err);
        }
      }
    } catch (err: any) {
      console.error("❌ Error running seat status update cron:", err);
    }
  });
};
