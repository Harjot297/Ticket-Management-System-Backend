import { Request, Response } from "express";
import mongoose from "mongoose";
import Movie from "../../schemas/Movie";

export const getSingleMovie = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      console.log("In get single movie router");
      res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
      return;
    }

    const movie = await Movie.findById(movieId);

    if (!movie) {
      res.status(404).json({
        success: false,
        message: "Movie not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Movie details fetched successfully",
      data: movie,
    });
  } catch (err: any) {
    console.error("Error fetching movie details:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
