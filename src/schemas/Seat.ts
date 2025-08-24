import mongoose from 'mongoose'

const seatSchema = new mongoose.Schema({
    hallId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hall',
        required: true,
    },
    theatreId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Theatre',
        required: true,
    },
    seatNumber: {
        type: String,
        required: true,
    },
    row: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true, // Like VIP, Normal etc
        enum : ['regular' , 'premium' , 'vip']
    },
    isAvailable: { // for temporarily locking and booking
        type: Boolean,
        required: true,
    },
    status: {
        type: String,
        enum: ['free', 'booked'],
        default: 'free'
    }, 
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Seat.ts
    selectedByUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    selectedAt: {
        type: Date,
        default: null,
    },
} , {   
    timestamps: true,
})
seatSchema.index({ hallId: 1, seatNumber: 1 }, { unique: true });
// NOTE: Ensures seatNumber is unique within hall ( known as Compound Indexes )
export default mongoose.model('Seat' , seatSchema);