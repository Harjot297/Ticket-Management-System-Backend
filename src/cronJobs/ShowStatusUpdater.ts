import cron from "node-cron";
import dayjs from "dayjs";
import Show from "../schemas/Show";
import Seat from "../schemas/Seat";

export const showStatusUpdater = () => {
  cron.schedule("* * * * *", async () => {
    const now = dayjs().toDate(); // Convert to native Date for MongoDB comparison

    // Update scheduled → running
    const result = await Show.updateMany(
      {
        status: "scheduled",
        startTime: { $lte: now },
      },
      {
        $set: { status: "running" },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `🎬 Show status updated to 'running' for ${result.modifiedCount} shows.`
      );
    }

    const completedShows = await Show.find({
      status: "running",
      endTime: { $lte: now },
    });

    if (completedShows.length > 0) {
      const completedShowIds = completedShows.map((show) => show._id);

      // Mark shows as completed
      const result2 = await Show.updateMany(
        { _id: { $in: completedShowIds } },
        { $set: { status: "completed" } }
      );

      // Reset seat statuses
      await Seat.updateMany(
        { _id: { $in: completedShows.flatMap((show) => show.seatsBooked) } },
        {
          $set: {
            status: "free",
            bookedBy: null,
            isAvailable: true, // optional: reset locking too
          },
        }
      );

      console.log(
        `🎬 Show status updated to completed for ${result2.modifiedCount} shows.`
      );
    }
  });
};
