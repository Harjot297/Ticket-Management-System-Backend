import express from 'express'
import { auth } from '../middlewares/auth'
import { selectSeats } from '../controllers/booking/selectSeats'
import { initiateBooking } from '../controllers/booking/inititateBooking';
import { confirmBooking } from '../controllers/booking/confirmBooking';
import { cancelBooking } from '../controllers/booking/cancelBooking';
import { getUsersAllBookings } from '../controllers/booking/getUsersAllBookings';
import { getSpecificBookings } from '../controllers/booking/getSpecificBookings';
import { isTheatreOrAdmin } from '../middlewares/isTheatreOrAdmin';
import { getBookingsByShow } from '../controllers/booking/getBookingsByShow';
import { userScopedCache } from '../helpers/redisCache';
import { cacheSpecificBooking } from '../middlewares/bookings/cacheSpecificBooking';
import { cacheBookingsByShow } from '../middlewares/bookings/cacheBookingsByShow';

export default (router: express.Router) => {
    router.post('/seats/select' , auth , selectSeats);
    router.post('/payment/initiate-booking' , auth , initiateBooking);
    router.post('/payment/confirm-booking' , auth , confirmBooking);
    router.patch('/bookings/:bookingId/cancel' , auth , cancelBooking);
    router.get('/bookings/user' , auth , userScopedCache('erc:bookings:user') , getUsersAllBookings);
    router.get('/bookings/:bookingId' , auth , cacheSpecificBooking , getSpecificBookings);
    router.get('/bookings/show/:showId' , auth , isTheatreOrAdmin , cacheBookingsByShow, getBookingsByShow);
}

// await delPattern("erc:bookings:*");
// await delPattern("erc:bookings:show:*");

