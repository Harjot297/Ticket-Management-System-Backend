import {Request, Response } from 'express'
import mongoose from 'mongoose';
import Movie from '../../schemas/Movie';
import redisClient from '../../redisClient';

export const toggleMovieStatus = async (req: Request , res: Response) : Promise<void> => {
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
        
        movie.isActive = !movie.isActive;
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
            message: `Movie is now ${movie.isActive ? "active" : "archived"}`,
            data: movie,
        })
        return;
    }
    catch(err: any){
        console.log("Error toggling movie Status" , err);
        res.status(500).json({
            success: false,
            message: "Error toggling movie Status"
        })
        return;
    }
}