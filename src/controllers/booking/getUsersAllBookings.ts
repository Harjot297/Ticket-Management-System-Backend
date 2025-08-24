import express from 'express';
import Booking from '../../schemas/Booking';

export const getUsersAllBookings = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const userId = req.user.userId;

    const bookings = await Booking.find({ userId })
      .sort({ bookingTime: -1 })
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

    if (!bookings.length) {
      res.status(200).json({
        success: true,
        message: "No bookings found for user",
        bookings: [],
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Bookings found for user",
      bookings,
    });
  } catch (err: any) {
    console.error("❌ Error getting all bookings for user:", err);
    res.status(500).json({
      success: false,
      message: "Error getting all bookings for user",
    });
  }
};
