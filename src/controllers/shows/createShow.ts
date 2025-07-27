import express from "express";
import mongoose from "mongoose";
import Movie from "../../schemas/Movie";
import Theatre from "../../schemas/Theatre";
import Hall from "../../schemas/Hall";
import Show from "../../schemas/Show";
import { createShowBody } from "../../interfaces/show_interface/createShowBody";
import { delPattern } from "../../helpers/redisCache";
import { ALLOWED_LANGUAGES } from "../../constants";
import { getLocalDateTime } from "../../helpers/dateHelpers";

export const createShow = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const {
      movieId,
      theatreId,
      hallId,
      showDate, // format: YYYY-MM-DD
      startTime, // format: HH:mm
      endTime, // format: HH:mm
      language,
      format,
      pricing,
    } : createShowBody = req.body;

    // Required fields check
    if (
      !movieId ||
      !theatreId ||
      !hallId ||
      !startTime ||
      !endTime ||
      !language ||
      !format ||
      !showDate
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide all the required fields",
      });
      return;
    }

    if (!pricing || !pricing.regular || !pricing.vip || !pricing.premium) {
      res.status(400).json({
        success: false,
        message: "Please provide pricing for all the categories",
      });
      return;
    }

    if(!ALLOWED_LANGUAGES.includes(language)){
      res.status(400).json({
        success: false,
        message: "Invalid language , language can only be english,hindi,tamil,telugu (lowercase)"
      })
      return;
    }

    

    if (
      !mongoose.Types.ObjectId.isValid(movieId) ||
      !mongoose.Types.ObjectId.isValid(theatreId) ||
      !mongoose.Types.ObjectId.isValid(hallId)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid movieId, theatreId or hallId",
      });
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(showDate)) {
      res.status(400).json({
        success: false,
        message: "Invalid showDate format. Use YYYY-MM-DD",
      });
      return;
    }

    const start = getLocalDateTime(showDate, startTime);
    const end = getLocalDateTime(showDate, endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid startTime or endTime format. Use HH:mm",
      });
      return;
    }

    if (end <= start) {
      res.status(400).json({
        success: false,
        message: "endTime must be after startTime",
      });
      return;
    }
    const now = new Date();
    if(start < now){
      res.status(400).json({
        success: false,
        message: "Show cannot be created in the past",
      })
      return;
    }

    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      res.status(404).json({ success: false, message: "Theatre not found" });
      return;
    }

    if (
      req.user.role !== "admin" &&
      req.user.userId.toString() !== theatre.owner.toString()
    ) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to create a show for this theatre",
      });
      return;
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404).json({ success: false, message: "Movie not found" });
      return;
    }

    if(language !== movie.language){
      res.status(400).json({
        success: false,
        message: "Language of the movie and show must be same"
      })
      return;
    }

    

    const movieRuntime = movie.duration; // in minutes
    const showDuration = (end.getTime() - start.getTime()) / (1000 * 60); // in minutes

    if (movieRuntime > showDuration) {
      res.status(400).json({
        success: false,
        message: "Movie runtime is greater than the show duration",
      });
      return;
    }

    const hall = await Hall.findById(hallId);
    if (!hall) {
      res.status(404).json({ success: false, message: "Hall not found" });
      return;
    }

    if(format !== hall.format){
      res.status(400).json({
        success: false,
        message: "Format of the Hall and show must be same"
      })
      return;
    }

    if (hall.theatreId.toString() !== theatreId) {
      res.status(400).json({
        success: false,
        message: "Hall does not belong to the theatre",
      });
      return;
    }

    const overlappingShow = await Show.findOne({
      hallId: hallId,
      $or: [
        {
          startTime: { $lt: end },
          endTime: { $gt: start },
        },
      ],
    });

    if (overlappingShow) {
      res.status(400).json({
        success: false,
        message: "Show cannot be created due to overlap with an existing show",
      });
      return;
    }

    const show = await Show.create({
      movieId,
      hallId,
      theatreId,
      showDate: new Date(showDate),
      startTime: start,
      endTime: end,
      language: movie.language,
      format: hall.format,
      seatsBooked: [],
      status: "scheduled",
      pricing,
    });

    // CACHE INVALIDATION 
    try{
      delPattern("erc:shows:movie:*");
      delPattern("erc:shows:theatre:*");
    }
    catch(err: any){
      console.error("Error invalidating cache:", err);
    }

    res.status(200).json({
      success: true,
      message: "Show created successfully",
      data: show,
    });
  } catch (err) {
    console.error("Error creating show:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
