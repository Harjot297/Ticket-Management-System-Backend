import { Request, Response } from "express";
import Movie from "../../schemas/Movie";

export const searchMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title = "", genre = "" } = req.query;

    const filters: any = {
      isActive: true,
    };

    if (title) {
      filters.title = { $regex: title as string, $options: "i" };
    }

    if (genre) {
      filters.genre = { $regex: genre as string, $options: "i" };
    }

    const results = await Movie.find(filters).sort({ releaseDate: -1 });

    res.status(200).json({
      success: true,
      message: "Search results fetched successfully",
      data: results,
    });
    return;
  } catch (err: any) {
    console.error("Error searching movies:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    return;
  }
};
