import express from "express";
import Movie from "../../schemas/Movie";
import { v2 as cloudinary } from "cloudinary";
import redisClient from "../../redisClient";
import { delPattern } from "../../helpers/redisCache";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const createMovie = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
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

    // Basic validation
    if (!title || !description || !duration || !genre || !language || !releaseDate) {
      res.status(400).json({
        success: false,
        message:
          "Please provide all required fields (title, description, duration, genre, language, releaseDate).",
      });
      return;
    }

    // Admin role check
    if (req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Only admin can create movies",
      });
      return;
    }

    // Check for duplicates
    const existingMovie = await Movie.findOne({
      title: title.trim(),
      language: language.trim().toLowerCase(),
    });

    if (existingMovie) {
      res.status(400).json({
        success: false,
        message: "A movie with this title and language already exists.",
      });
      return;
    }

    // Validate releaseDate
    const release = new Date(releaseDate);
    if (isNaN(release.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid releaseDate format.",
      });
      return;
    }

    if (release < new Date()) {
      res.status(400).json({
        success: false,
        message: "Release date must be today or in the future.",
      });
      return;
    }

    // Validate expiryDate
    let expiry: Date | undefined = undefined;
    if (expiryDate) {
      expiry = new Date(expiryDate);
      if (isNaN(expiry.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid expiryDate format.",
        });
        return;
      }
      if (expiry <= release) {
        res.status(400).json({
          success: false,
          message: "Expiry date must be after the release date.",
        });
        return;
      }
    }

    // ---------------------------
    // Handle Poster Upload
    // ---------------------------
    let posterUrl = "";
    if (req.files && (req.files as any).poster) {
      const posterFile = (req.files as any).poster;
      const uploadResult = await cloudinary.uploader.upload(posterFile.tempFilePath, {
        folder: "movies/posters",
        resource_type: "image",
      });
      posterUrl = uploadResult.secure_url;
    } else {
      res.status(400).json({
        success: false,
        message: "Poster image is required",
      });
      return;
    }

    // ---------------------------
    // Handle Trailer Upload
    // ---------------------------
    let trailerUrl = "";
    if (req.files && (req.files as any).trailer) {
      const trailerFile = (req.files as any).trailer;
      const uploadResult = await cloudinary.uploader.upload(trailerFile.tempFilePath, {
        folder: "movies/trailers",
        resource_type: "video",
      });
      trailerUrl = uploadResult.secure_url;
    } else {
      res.status(400).json({
        success: false,
        message: "Trailer video is required",
      });
      return;
    }

    // Determine status
    const status = release > new Date() ? "upcoming" : "released";

    
    // Create movie
    const movie = await Movie.create({
      title: title.trim(),
      description,
      duration,
      genre,
      language: language.trim().toLowerCase(),
      releaseDate: release,
      expiryDate: expiry,
      posterUrl,
      trailerUrl,
      certificate,
      cast,
      director,
      status,
      isActive: true,
    });

    // Cache invalidation
    try{
      await delPattern("erc:movies:all:admin:*");
      await delPattern("erc:movies:all:public:*");
      await redisClient.del("erc:movies:upcoming");
      await redisClient.del(`erc:movie:detail:${movie._id}`);
      await delPattern("erc:movies:search:*");
    }
    catch(e){
      console.warn("Cache invalidation failed:", (e as Error).message)
    }

    res.status(201).json({
      success: true,
      message: "Movie created successfully.",
      data: movie,
    });
  } catch (err: any) {
    console.error("Error creating movie:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
