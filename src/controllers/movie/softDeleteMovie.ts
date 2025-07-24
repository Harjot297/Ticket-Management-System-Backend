import {Request , Response } from 'express'
import mongoose from 'mongoose';
import Movie from '../../schemas/Movie';
import redisClient from '../../redisClient';

export const softDeleteMovie = async (req: Request , res: Response ) : Promise<void> => {
    try{
        const movieId = req.params.movieId;
        if(!movieId){
            res.status(400).json({
                success: false,
                message : "Movie Id is required"
            })
            return;
        }
        
        if(!mongoose.Types.ObjectId.isValid(movieId)){
            res.status(400).json({
                success: false,
                message: "Invalid movie id"
            })
            return;
        }

        // Fetch movie
        const movie = await Movie.findById(movieId);
        if(!movie){
            res.status(404).json({
                success: false,
                message: "Movie not found"
            })
            return;
        }
        // check if movie is already deleted
        if(movie.isActive === false){
            res.status(400).json({
                success: false,
                message: "Movie already archived"
            })
            return;
        }
        movie.isActive = false;
        await movie.save();

        // Cache invalidation
        try{
          const keys = await redisClient.keys("erc:movies:all:admin:*");
          if (keys.length > 0) await redisClient.del(keys);
          const publicKeys = await redisClient.keys("erc:movies:all:public:*");
          if (publicKeys.length > 0) await redisClient.del(publicKeys);
        }
        catch(e){
          console.warn("Cache invalidation failed:", (e as Error).message)
        }

        res.status(200).json({
            success: true,
            message: "Movie archived successfully",
            data: movie,
        })
        return;
    }
    catch(err : any){
        console.log("Error deleting / archiving movie : " , err);
        res.status(500).json({
            success: false,
            message: "Error deleting / archiving movie"
        })
        return;
    }
}