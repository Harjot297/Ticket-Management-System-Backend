import express from "express";
import mongoose from "mongoose";
import Show from "../../schemas/Show";
import Movie from "../../schemas/Movie";
import dayjs from "dayjs";

export const getShowsByMovie = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const { language, format, date } = req.query;
    const rawDays = req.query.days;

    // Validate movieId
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      res.status(400).json({
        success: false,
        message: "Invalid movieId",
      });
      return;
    }

    // Parse and validate 'days'
    let days = rawDays ? parseInt(rawDays as string, 10) : 1;
    if (isNaN(days) || days < 1 || days > 30) {
      res.status(400).json({
        success: false,
        message: "Invalid 'days' value. Must be a number between 1 and 30.",
      });
      return;
    }

    // Check movie exists and is active
    const movie = await Movie.findById(movieId);
    if (!movie || !movie.isActive) {
      res.status(404).json({
        success: false,
        message: "Movie not found or inactive",
      });
      return;
    }

    // Determine date range
    const showDate = date ? dayjs(date as string) : dayjs();
    if (!showDate.isValid()) {
      res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
      return;
    }

    const startOfDay = showDate.startOf("day").toDate();
    const endOfDay = showDate.add(days - 1, "day").endOf("day").toDate();

    // Build query
    const query: any = {
      movieId: movieId,
      status: { $in: ["scheduled", "running"] },
      showDate: { $gte: startOfDay, $lte: endOfDay },
    };

    if (language) query.language = language;
    if (format) query.format = format;

    const shows = await Show.find(query)
      .populate("theatreId", "name location")
      .populate("hallId", "name format")
      .select("-__v -seatsBooked")
      .sort({ startTime: 1 }); // Sorted by start time

    res.status(200).json({
      success: true,
      message: "Shows fetched successfully",
      filters: {
        movieId,
        language,
        format,
        startDate: startOfDay,
        endDate: endOfDay,
        days,
      },
      data: shows,
    });
  } catch (err) {
    console.error("Error fetching shows by movie:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
