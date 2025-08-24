import express from 'express'
import crypto from 'crypto'
import mongoose from 'mongoose';
import Booking from '../../schemas/Booking';
import Show from '../../schemas/Show';
import Seat from '../../schemas/Seat';
import { delPattern } from '../../helpers/redisCache';
import redisClient from '../../redisClient';

export const confirmBooking = async (req: express.Request , res: express.Response) : Promise<void> => {
    try{
        const { seatIds, 
            showId, 
            bookingId }: {
            seatIds: string[]; 
            showId: string;
            bookingId: string;
        } = req.body;

        const userId = req.user.userId;

        const razorpay_order_id = req.body?.razorpay_order_id
        const razorpay_payment_id = req.body?.razorpay_payment_id
        const razorpay_signature = req.body?.razorpay_signature

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature ||
            !showId ||
            !userId ||
            !seatIds ||
            seatIds.length === 0
        ) {
            res.status(200).json({ success: false, message: "Payment Failed" })
            return;
        }

        let body = razorpay_order_id + "|" + razorpay_payment_id

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            await bookSeats(showId, seatIds, userId, bookingId, razorpay_payment_id, res);
            res.status(200).json({ success: true, message: "Payment Verified" })
            return;
        }

        

        res.status(200).json({ success: false, message: "Payment Failed" })
        return;


    }
    catch(err: any){
        console.log("Failed to confirm your booking: " , err);
        res.status(500).json({
            success: false,
            message: "Failed to confirm your booking"
        })
    }
}

const bookSeats = async (showId: string , 
    seatIds: string[] , 
    userId: mongoose.Types.ObjectId , 
    bookingId: string , 
    razorpay_payment_id : string,
    res: express.Response) => {
    // basic validation 
    if(!showId || !userId || !bookingId || !seatIds || seatIds.length === 0){
        res.status(200).json({ success: false, message: "Payment Failed" })
        return;
    }
    // Now actually book the seat because payment was successfuly done
    const bookingIdMongoose = new mongoose.Types.ObjectId(bookingId)
    // fetch booking
    const booking = await Booking.findById(bookingIdMongoose);

    // fetch seats
    const seats = await Seat.find({_id: {$in : seatIds}});
    if(!seats){
        res.status(200).json({ success: false, message: "Payment Failed (seats not found )" })
        return;
    }
    for(const seat of seats){
        if(!seat.isAvailable || seat.status === 'booked'){
            res.status(200).json({ success: false, message: "Payment Failed (seat already booked )" })
            return;
        }
        seat.isAvailable = false;
        seat.status = 'booked';
        seat.selectedByUser = null;
        seat.bookedBy = userId;
        seat.selectedAt = null;
        await seat.save();
    }

    if(!booking){
        res.status(200).json({ success: false, message: "Payment Failed (booking not found )" })
        return;
    }
    const show = await Show.findById(showId);
    if(!show){
        res.status(200).json({ success: false, message: "Payment Failed (show not found )" })
        return;
    }

    let mongoSeatIds = seatIds.map((seatId) => new mongoose.Types.ObjectId(seatId));
    // update booking

    booking.seats = mongoSeatIds;
    booking.bookingStatus = "confirmed";
    booking.paymentStatus = "paid";
    booking.transactionId = razorpay_payment_id;
    await booking.save();

    show.seatsBooked = mongoSeatIds; // update show
    await show.save();
    try{
        await delPattern("erc:shows:movie:*");
        await delPattern("erc:shows:theatre:*");
        await redisClient.del(`erc:show:details:${showId}`); // delete show details from cache
        await delPattern("erc:bookings:user:*");
        await delPattern("erc:bookings:*");
        await delPattern("erc:bookings:show:*");
    }
    catch(err: any){

    }

    return;
    
}