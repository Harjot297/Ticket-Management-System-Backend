import mongoose from 'mongoose'

const hallSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true,
    },
    theatreId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Theatre',
        required: true,
    },
    rows: { // Number of rows , maximum 26 ( row A to Z ) 
        type: Number,
        required: true,
        min: [6 , 'Must be atleast 6 rows'],
        max: [26 , 'Must be atmost 26 rows']
    },
    seatsPerRow: {
        type: Number,
        required: true,
    },
    seats : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Seat',
            required: true,
        }
    ],
    format: {
        type: String,
        required: true,
        enum: ['2D', '3D', 'IMAX'],
    },
    isActive: { // imp if you want to soft delete halls
        type: Boolean,
        default: true
    },
    

}, {
    timestamps: true, // so as to automatically handle createdAt and updatedAt
})
hallSchema.index({ theatreId: 1, name: 1 }, { unique: true }); // ensures same name doesnt exist within same theatre
hallSchema.index({ theatreId: 1 }); // for fast quering by theatreId

export default mongoose.model('Hall' , hallSchema) 