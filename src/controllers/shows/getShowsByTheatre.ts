import express from "express";
import mongoose from "mongoose";
import Show from "../../schemas/Show";
import Theatre from "../../schemas/Theatre";
import dayjs from "dayjs"; 

export const getShowsByTheatre = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { theatreId } = req.params;
    const { language, format, date } = req.query;
    const rawDays = req.query.days;

    // Validate theatreId
    if (!mongoose.Types.ObjectId.isValid(theatreId)) {
      res.status(400).json({
        success: false,
        message: "Invalid theatreId",
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

    // Check if theatre exists and is active
    const theatre = await Theatre.findById(theatreId);
    if (!theatre || !theatre.isActive) {
      res.status(404).json({
        success: false,
        message: "Theatre not found or inactive",
      });
      return;
    }

    // Parse and validate show date
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
      theatreId,
      status: { $in: ["scheduled", "running"] },
      showDate: { $gte: startOfDay, $lte: endOfDay },
    };

    if (language) query.language = language;
    if (format) query.format = format;

    const shows = await Show.find(query)
      .populate("movieId", "title language duration genre")
      .populate("hallId", "name format")
      .select("-__v -seatsBooked")
      .sort({ startTime: 1 });

    res.status(200).json({
      success: true,
      message: "Shows fetched successfully",
      filters: {
        theatreId,
        language,
        format,
        startDate: startOfDay,
        endDate: endOfDay,
        days,
      },
      data: shows,
    });
  } catch (err) {
    console.error("Error fetching shows by theatre:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
