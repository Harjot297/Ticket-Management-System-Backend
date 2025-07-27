import express from 'express'
import mongoose from 'mongoose';
import Show from '../../schemas/Show';
import Hall from '../../schemas/Hall';
import { updateShowBody } from '../../interfaces/show_interface/updateShowBody';
import Movie from '../../schemas/Movie';
import { delPattern } from '../../helpers/redisCache';

function getLocalDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

export const updateShow = async (req: express.Request , res: express.Response) : Promise<void> => {
    try{
        const showId = req.params.showId;
        if(!showId){
            res.status(400).json({
                success: false,
                message: "Show Id is required"
            })
            return;
        }
        if(!mongoose.Types.ObjectId.isValid(showId)){
            res.status(400).json({
                success: false,
                message: "Invalid Show Id"
            })
            return;
        }
        const show = await Show.findById(showId);
        if (!show) {
            res.status(404).json({
                success: false,
                message: "Show not found",
            });
            return;
        }

        if (show.status === "cancelled" || show.status === "completed" || show.status === "running") {
            res.status(409).json({
                success: false,
                message: `Cannot update a ${show.status} show`,
            });
            return;
        }
        const {
            startTime,
            endTime,
            language,
            format,
            pricing,
        } : updateShowBody = req.body;

        if(language !== 'english' && language !== 'hindi' && language !== 'tamil' && language !== 'telugu'){
            res.status(400).json({
                success: false,
                message: "Invalid language , language can only be english,hindi,tamil,telugu (small case )"
            })
            return;
        }

        const movie = await Movie.findById(show.movieId);
        if(!movie){
            res.status(404).json({
                success: false,
                message: "Movie not found"
            })
            return;
        }

        if(language !== movie.language){
            res.status(400).json({
                success: false,
                message: "Language of Movie and Show must match"
            })
            return;
        }

        const hall = await Hall.findById(show.hallId);
        if (!hall) {
            res.status(404).json({
                success: false,
                message: "Hall not found",
            });
            return;
        }
        if(format !== hall.format){
            res.status(400).json({
                success: false,
                message: "Format of Hall and Show must match"
            })
        }

        // validate startTime and endTime
        if (startTime && endTime) {
            const dateStr = show.showDate.toISOString().split("T")[0];
            const start = getLocalDateTime(dateStr, startTime);
            const end = getLocalDateTime(dateStr, endTime);

            if (end <= start) {
                res.status(400).json({
                success: false,
                message: "End time must be after start time",
                });
                return;
            }
            // Check for show time conflicts in the same hall
            const overlappingShow = await Show.findOne({
                _id: { $ne: showId },
                hallId: show.hallId,
                startTime: { $lt: end },
                endTime: { $gt: start },
                status: { $nin: ["cancelled", "completed"] },
            });

            if (overlappingShow) {
                res.status(409).json({
                success: false,
                message: "Another show already scheduled during this time in the same hall",
                });
                return;
            }

            show.startTime = start;
            show.endTime = end;
        }

        if (language) show.language = language;
        if (format) show.format = format;

        if (pricing) {
            show.pricing = {
                ...show.pricing,
                ...pricing,
            };
        }

        await show.save();

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
        message: "Show updated successfully",
        data: show,
        });
        return;

    }
    catch(err : any){
        console.log("Error updating Show : " , err);
        res.status(500).json({
            success: false,
            message : "Internal Server Error"
        })
        return;
    }
}