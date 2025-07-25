import cron from "node-cron";
import Movie from "../schemas/Movie"; // adjust path to your Movie schema
import dayjs from "dayjs";
import redisClient from "../redisClient";
import { delPattern } from "../helpers/redisCache";

// Run every day at midnight (00:00)
export const movieStatusUpdater = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const today = dayjs().startOf("day").toDate();

      const result = await Movie.updateMany(
        { status: "upcoming", releaseDate: { $lte: today } },
        { $set: { status: "released" } }
      );

      if (result.modifiedCount > 0) {
        console.log(`🎬 Movie status updated for ${result.modifiedCount} movies.`);
        // Cache invalidation
        try{
          await delPattern("erc:movies:all:admin:*");
          await delPattern("erc:movies:all:public:*");
          await redisClient.del("erc:movies:upcoming");
        }
        catch(e){
          console.warn("Cache invalidation failed:", (e as Error).message)
        }
      } else {
        console.log("No movies to update today.");
      }
    } catch (err) {
      console.error("Error updating movie statuses:", err);
    }
  });
};
