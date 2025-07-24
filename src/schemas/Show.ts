import mongoose from "mongoose";
const showSchema = new mongoose.Schema({
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true,
    },
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
    showDate: {
        type: Date,
        required: true,
        index: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
        validate: {
            validator: function () {
                return this.endTime > this.startTime;
            },
            message: 'endTime must be after startTime'
        }
    },
    language: {
        type: String,
        required: true,
        enum: ['english', 'hindi', 'tamil', 'telugu'],
    },
    format: {
        type: String,
        required: true,
        enum: ['2D', '3D', 'IMAX']
    },
    seatsBooked: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat',
    }],
    status: {
        type: String,
        required: true,
        enum: ['scheduled', 'cancelled', 'completed'],
        default: 'scheduled'
    },
    pricing: {
        regular: { type: Number, required: true },
        vip: { type: Number, required: true },
        premium: { type: Number, required: true },
    }
}, {
    timestamps: true,
});

showSchema.index({ hallId: 1, startTime: 1 });
showSchema.index({ movieId: 1, theatreId: 1 });
