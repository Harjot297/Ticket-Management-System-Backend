import express from 'express';
import Movie from '../../schemas/Movie';

export const getUpcomingMovie = async (req: express.Request, res: express.Response): Promise<void> => {
    try {
        const upcomingMovies = await Movie.find({ status: 'upcoming', isActive: true }); // 🔒 Only active movies

        // Important: `.find()` always returns an array, so no need to check `if (!upcomingMovies)` — instead check `length`
        if (upcomingMovies.length === 0) {
            res.status(404).json({
                success: true,
                message: "No upcoming movies found",
                data: [],
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Upcoming movies fetched successfully",
            data: upcomingMovies,
        });
        return;
    } catch (err: any) {
        console.log("Error fetching upcoming movies: ", err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
        return;
    }
};
