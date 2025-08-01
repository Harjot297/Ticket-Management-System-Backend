import express from "express";
import mongoose from "mongoose";
import Show from "../../schemas/Show";
import Seat from "../../schemas/Seat";
import { delPattern } from "../../helpers/redisCache";

export const cancelShow = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const showId = req.params.showId;

    if (!showId) {
      res.status(400).json({
        success: false,
        message: "Missing Show ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      res.status(400).json({
        success: false,
        message: "Invalid MongoDB Object ID",
      });
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

    const now = new Date();
    if (show.startTime <= now) {
      res.status(409).json({
        success: false,
        message: "Show has already started or ended and cannot be cancelled",
      });
      return;
    }

    if (show.status === "cancelled") {
      res.status(409).json({
        success: false,
        message: "Show is already cancelled",
      });
      return;
    }

    show.status = "cancelled";

    // Reset booked seats (if any)
    if (show.seatsBooked.length > 0) {
      await Seat.updateMany(
        { _id: { $in: show.seatsBooked } },
        {
          $set: {
            isAvailable: true,
            status: "free",
            bookedBy: null,
          },
        }
      );
    }
    show.seatsBooked = [];

    await show.save();

    // TODO: Initiate and Issue refund to all the booked seats
    // TODO: 1. Find all confirmed bookings for this show
    //       2. Initiate refunds via Razorpay using transactionId
    //       3. Update bookingStatus = "refunded", paymentStatus = "refunded"
    //       4. Notify user (optional)

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
      message: "Show cancelled successfully",
    });
  } catch (err) {
    console.error("Error cancelling show:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
