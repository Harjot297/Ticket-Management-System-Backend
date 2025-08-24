import express from "express";
import mongoose from "mongoose";
import Booking from "../../schemas/Booking";

export const getBookingsByShow = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { showId } = req.params;

    // Validate showId
    if (!mongoose.Types.ObjectId.isValid(showId)) {
      res.status(400).json({
        success: false,
        message: "Invalid show ID",
      });
      return;
    }

    const bookings = await Booking.find({ showId , bookingStatus: 'confirmed'})
      .populate({
        path: "userId",
        select: "name email", // Optional: Include phone if needed
      })
      .populate({
        path: "seats",
        select: "seatNumber row type",
      })
      .populate({
        path: "hallId",
        select: "name",
      });
      

    res.status(200).json({
      success: true,
      message: `Found ${bookings.length} bookings for this show`,
      bookings,
    });
  } catch (err: any) {
    console.error("❌ Error fetching bookings by show:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching bookings",
    });
  }
};
