import express from 'express';
import mongoose from 'mongoose';
import Booking from '../../schemas/Booking';
import Show from '../../schemas/Show';
import Seat from '../../schemas/Seat'; // Assuming your seat model is in this path
import { delPattern } from '../../helpers/redisCache';
const { instance } = require("../../helpers/razorpay");

export const cancelBooking = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { bookingId } = req.params;

    // 1. Validate bookingId
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      res.status(400).json({
        success: false,
        message: "Invalid or missing booking ID",
      });
      return;
    }

    // 2. Fetch Booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    // 3. Auth check
    if (booking.userId !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: "Unauthorized to cancel this booking",
      });
      return;
    }

    // 4. Already cancelled?
    if (booking.bookingStatus !== 'confirmed') {
      res.status(400).json({
        success: false,
        message: "Only confirmed bookings can be cancelled",
      });
      return;
    }

    // 5. Fetch show
    const show = await Show.findById(booking.showId);
    if (!show) {
      res.status(404).json({
        success: false,
        message: "Associated show not found",
      });
      return;
    }

    // 6. Check show hasn't started
    const now = new Date();
    if (show.startTime <= now) {
      res.status(400).json({
        success: false,
        message: "Cannot cancel booking after the show has started",
      });
      return;
    }

    // 7. Refund payment
    const refund = await instance.payments.refund(booking.transactionId, {
      amount: booking.totalAmount,
      speed: "optimum",
      notes: {
        note1: `Refund for show ${booking.showId}`,
        note2: `Booking ID: ${booking._id}`,
      },
    });

    // 8. Remove seats from show.seatsBooked
    const seatIds = booking.seats; // Assuming this is an array of ObjectIds

    await Show.findByIdAndUpdate(booking.showId, {
      $pull: { seatsBooked: { $in: seatIds } },
    });

    // 9. Free up the seats
    await Seat.updateMany(
      { _id: { $in: seatIds } },
      {
        $set: {
          isAvailable: true,
          status: 'free', // Assuming you have a `status` field
        },
      }
    );

    // 10. Update booking
    booking.paymentStatus = 'refunded';
    booking.bookingStatus = 'refunded';
    await booking.save();

    // CACHE INVALIDATION
    try{
      await delPattern("erc:bookings:user:*");
      await delPattern("erc:bookings:*");
      await delPattern("erc:bookings:show:*");
    }
    catch(err : any){
      console.log("❌ Error in cache invalidation:", err);
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled, seats released, and refund processed",
      refund,
    });

  } catch (err: any) {
    console.error("❌ Error in cancelBooking:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
