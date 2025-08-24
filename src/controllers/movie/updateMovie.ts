import express from "express";
import mongoose from "mongoose";
import Movie from "../../schemas/Movie";
import { v2 as cloudinary } from "cloudinary";
import redisClient from "../../redisClient";
import { delPattern } from "../../helpers/redisCache";
import Show from "../../schemas/Show";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const updateMovie = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { movieId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      res.status(400).json({ success: false, message: "Invalid movie ID." });
      return;
    }

    // Find movie
    const movie = await Movie.findById(movieId);
    if (!movie) {
      res.status(404).json({ success: false, message: "Movie not found." });
      return;
    }

    // Role check
    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Only admin can update movies.",
      });
      return;
    }

    const {
      title,
      description,
      duration,
      genre,
      language,
      releaseDate,
      expiryDate,
      certificate,
      cast,
      director,
    } = req.body;

    // Validate required fields
    if (!title || !description || !duration || !genre || !language || !releaseDate) {
      res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
      return;
    }

    // Check for duplicate title-language combo (excluding self)
    const existingMovie = await Movie.findOne({
      _id: { $ne: movieId },
      title: title.trim(),
      language: language.trim().toLowerCase(),
    });

    if (existingMovie) {
      res.status(400).json({
        success: false,
        message: "Another movie with this title and language already exists.",
      });
      return;
    }

    // Validate releaseDate
    const release = new Date(releaseDate);
    if (isNaN(release.getTime())) {
      res.status(400).json({ success: false, message: "Invalid releaseDate." });
      return;
    }

    // if (release < new Date()) {
    //   res.status(400).json({
    //     success: false,
    //     message: "Release date must be today or a future date.",
    //   });
    //   return;
    // }

    // Validate expiryDate
    let expiry: Date | undefined;
    if (expiryDate) {
      expiry = new Date(expiryDate);
      if (isNaN(expiry.getTime()) || expiry <= release) {
        res.status(400).json({
          success: false,
          message: "Expiry date must be a valid date after the release date.",
        });
        return;
      }
    }

    // Upload poster if provided
    let posterUrl = movie.posterUrl;
    if (req.files && (req.files as any).poster) {
      const posterFile = (req.files as any).poster;
      const upload = await cloudinary.uploader.upload(posterFile.tempFilePath, {
        folder: "movies/posters",
        resource_type: "image",
      });
      posterUrl = upload.secure_url;
    }

    // Upload trailer if provided
    let trailerUrl = movie.trailerUrl;
    if (req.files && (req.files as any).trailer) {
      const trailerFile = (req.files as any).trailer;
      const upload = await cloudinary.uploader.upload(trailerFile.tempFilePath, {
        folder: "movies/trailers",
        resource_type: "video",
      });
      trailerUrl = upload.secure_url;
    }

    // Determine movie status
    const status = release > new Date() ? "upcoming" : "released";

    // Update movie
    movie.title = title.trim();
    movie.description = description.trim();
    movie.duration = duration;
    movie.genre = genre;
    movie.language = language.trim().toLowerCase();
    movie.releaseDate = release;
    movie.expiryDate = expiry;
    movie.certificate = certificate;
    movie.cast = cast;
    movie.director = director;
    movie.posterUrl = posterUrl;
    movie.trailerUrl = trailerUrl;
    movie.status = status;

    await movie.save();

    // Cache invalidation
    try{
      await delPattern("erc:movies:all:admin:*");
      await delPattern("erc:movies:all:public:*");
      await redisClient.del("erc:movies:upcoming");
      await redisClient.del(`erc:movie:detail:${movieId}`);
      await delPattern("erc:movies:search:*");
      await delPattern("erc:shows:movie:*");
      await delPattern("erc:shows:theatre:*");
      const shows = await Show.find({ movieId: movie._id });
      for (const show of shows) {
        await redisClient.del(`erc:show:details:${show._id}`);
      }

      await delPattern("erc:bookings:user:*");
      await delPattern("erc:bookings:*");
    }
    catch(e){
      console.warn("Cache invalidation failed:", (e as Error).message)
    }

    res.status(200).json({
      success: true,
      message: "Movie updated successfully.",
      data: movie,
    });
  } catch (err: any) {
    console.error("Error updating movie:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
