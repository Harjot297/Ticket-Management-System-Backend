import express from "express";
const { instance } = require("../../helpers/razorpay");
import Seat from "../../schemas/Seat";
import Show from "../../schemas/Show";
import Booking from "../../schemas/Booking";

export const initiateBooking = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { seatIds, showId }: { seatIds: string[]; showId: string } = req.body;

    if (!seatIds || !showId || seatIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "Invalid seatIds or showId",
      });
      return;
    }

    const seats = await Seat.find({ _id: { $in: seatIds } });
    const seatMap = new Map(seats.map(seat => [seat._id.toString(), seat]));

    const show = await Show.findById(showId);
    if (!show) {
      res.status(500).json({
        success: false,
        message: "Show not found",
      });
      return;
    }
    if (show.status !== "scheduled") {
      res.status(400).json({
        success: false,
        message: "Show is not available",
      });
      return;
    }

    if (seats.length !== seatIds.length) {
      res.status(400).json({
        success: false,
        message: "Some seatIds are invalid",
      });
      return;
    }

    // Now create total amount
    let total_amount = 0;

    for(const seatId of seatIds){
        try{
            const seat = seatMap.get(seatId);
            if (!seat) {
                res.status(400).json({
                    success: false,
                    message: `SeatId ${seatId} is invalid`,
                });
                return;
            }
            else if(seat.status === 'booked' || seat.isAvailable === false){
                res.status(400).json({
                    success: false,
                    message: `SeatId ${seatId} is already booked`,
                })
                return;
            }
            const seatType = seat.type;
            let seatPrice;
            if(seatType === 'regular'){
                seatPrice = show.pricing.regular;
            }
            else if(seatType === 'premium'){
                seatPrice = show.pricing.premium;
            }
            else if(seatType === 'vip'){
                seatPrice = show.pricing.vip;
            }
            else{
                res.status(400).json({
                    success: false,
                    message: `SeatId ${seatId} pricing is invalid`,
                })
                return;
            }
            total_amount += seatPrice;
        }
        catch(err: any){
            console.log(err)
            res.status(500).json({ success: false, message: err.message })
            return;
        }
    }

    // create an order
    const options = {
        amount: total_amount * 100,
        currency: "INR",
        receipt: `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    }

    try {
        // Initiate the payment using Razorpay
        const paymentResponse = await instance.orders.create(options)
        console.log(paymentResponse)
        const booking = await Booking.create({
            userId: req.user.userId,
            showId,
            hallId: show.hallId,
            theatreId: show.theatreId,
            seats: seatIds,
            totalAmount: total_amount,
            bookingStatus: 'pending',
            paymentStatus: 'pending',
            bookingTime: new Date(),
        });

        res.json({
            success: true,
            data: paymentResponse,
            bookingId: booking._id, // include this
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Could not initiate order." })
    }
  } catch (err: any) {
    console.log(err);
    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    })
  }
};
