import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    showId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Show",
        required: true
    },
    hallId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hall",
        required: true
    },
    theatreId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Theatre",
        required: true
    },
    seats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat',
        required: true
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'refunded', 'failed' , 'pending'],
        default: 'pending'
    },
    bookingStatus : {
        type : String,
        enum : ['confirmed', 'cancelled' , 'refunded'],
        default : 'confirmed'
    },
    bookingTime: {
        type: Date,
        default: Date.now, // Set the default value to the current date and time when created
    },
    transactionId: {
        type: String,
        required: true
    }
})

// For fast user history retrieval
bookingSchema.index({ userId: 1, bookingTime: -1 });
// For detecting duplicate transactions
bookingSchema.index({ transactionId: 1 }, { unique: true });


export default mongoose.model("Booking", bookingSchema)