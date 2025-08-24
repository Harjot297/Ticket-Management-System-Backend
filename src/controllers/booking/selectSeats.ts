import express from 'express';
import Seat from '../../schemas/Seat';
import Show from '../../schemas/Show';
import { delPattern } from '../../helpers/redisCache';

export const selectSeats = async (req: express.Request, res: express.Response) => { 
    try {
        const { seatIds, showId }: { seatIds: string[]; showId: string } = req.body;

        if (!seatIds || !showId || seatIds.length === 0) {
            res.status(400).json({
                success: false,
                message: "Invalid seatIds or showId"
            });
            return;
        }

        const seats = await Seat.find({ _id: { $in: seatIds } });
        const show = await Show.findById(showId);
        if(!show){
            res.status(500).json({
                success: false,
                message: "Show not found"
            })
            return;
        }
        if(show.status !== 'scheduled'){
            res.status(400).json({
                success: false,
                message: "Show is not available"
            })
            return;
        }

        if (seats.length !== seatIds.length) {
            return res.status(400).json({
                success: false,
                message: "Some seatIds are invalid"
            });
        }

        for (const seat of seats) {
            if (seat.isAvailable === false || seat.status === "booked") {
                return res.status(400).json({
                    success: false,
                    message: "Some seats are not available"
                });
            }

            if (seat.selectedByUser != null && seat.selectedByUser !== req.user.userId) {
                const now = new Date();
                if (now.getTime() - seat.selectedAt.getTime() < 15 * 60 * 1000) {
                    return res.status(400).json({
                        success: false,
                        message: "Some seats are already selected by another user"
                    });
                }
            }
        }

        
        

        await Seat.updateMany(
            { _id: { $in: seatIds } },
            {
                $set: {
                    selectedByUser: req.user.userId,
                    selectedAt: new Date()
                }
            }
        );

        // CACHE INVALIDATION 
        try{
            await delPattern("erc:bookings:user:*");
            await delPattern("erc:bookings:*");
            await delPattern("erc:bookings:show:*");
        }
        catch(err: any){
            console.error("Error deleting cache: " , err);
        }

        return res.status(200).json({
            success: true,
            message: "Seats selected successfully",
            seatIds,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

    } catch (err) {
        console.error("Error selecting seats:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};
