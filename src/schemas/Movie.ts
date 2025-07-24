import mongoose from "mongoose";
const movieSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true, 
        trim: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    duration: { 
        type: Number, 
        required: true 
    }, // in minutes
    genre: { 
        type: String, 
        required: true 
    },
    language: { 
        type: String, 
        required: true 
    },
    releaseDate: { 
        type: Date, 
        required: true 
    },
    expiryDate: { 
        type: Date 
    },  // Optional field
    posterUrl: { 
        type: String 
    },
    trailerUrl: { 
        type: String 
    },
    certificate: { 
        type: String 
    },
    cast: [{ 
        type: String 
    }],
    director: { 
        type: String  
    },
    status: { 
        type: String, 
        enum: ['upcoming', 'released', 'expired'], 
        default: 'upcoming' 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
}, { timestamps: true });

movieSchema.index({ title: 1, language: 1 });
movieSchema.index({ status: 1, releaseDate: 1 });
movieSchema.index({ genre: 1, language: 1 });

export default mongoose.model("Movie", movieSchema);