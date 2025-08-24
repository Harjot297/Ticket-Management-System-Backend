import express from 'express';
import mongoose from 'mongoose';
import Booking from '../../schemas/Booking';

export const getSpecificBookings = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const userId = req.user.userId;
    const bookingId = req.params.bookingId;

    // Validate bookingId
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({
        success: false, 
        message: "Invalid booking ID",
      });
      return;
    }

    // Fetch booking with deep population
    const booking = await Booking.findOne({ _id: bookingId, userId })
      .populate({
        path: 'showId',
        populate: [
          { path: 'movieId', select: 'title posterUrl duration certificate' },
          { path: 'theatreId', select: 'name location' },
          { path: 'hallId', select: 'name format' }
        ]
      })
      .populate({
        path: 'seats',
        select: 'seatNumber row type'
      });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found or you do not have access",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Booking details retrieved successfully",
      booking,
    });
  } catch (err: any) {
    console.error("❌ Error fetching booking details:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching booking details",
    });
  }
};
