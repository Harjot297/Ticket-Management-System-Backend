import {Request, Response } from 'express'
import mongoose from 'mongoose';
import Movie from '../../schemas/Movie';
import redisClient from '../../redisClient';
import { delPattern } from '../../helpers/redisCache';
import Show from '../../schemas/Show';

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