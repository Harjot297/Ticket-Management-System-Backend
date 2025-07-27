import express from 'express';
import mongoose from 'mongoose';
import Show from '../../schemas/Show';


export const getShowDetails = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { showId } = req.params;

    if (!showId || !mongoose.Types.ObjectId.isValid(showId)) {
      res.status(400).json({
        success: false,
        message: "Invalid or malformed showId",
      });
      return;
    }

    const show = await Show.findById(showId)
      .populate('movieId', 'title language format duration certificate')
      .populate('hallId', 'name totalSeats format')
      .populate('theatreId', 'name location')
      .populate('seatsBooked'); // You could also select only seatNumber/row/type if needed
    
    // PENDING: Caching
    // NOTE: When cache , do cache invalidation in theatre routes , hall routes , movie routes , 
    // and also in seat booking routes

    if (!show) {
      res.status(404).json({
        success: false,
        message: "Show not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Show details fetched successfully",
      data: show,
    });
    return;
  } catch (err: any) {
    console.error("Error fetching show details:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    return;
  }
};
