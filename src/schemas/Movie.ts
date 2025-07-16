import { Certificate } from 'crypto'
import mongoose from 'mongoose'

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description : {
        type: String,
        required: true,
    },
    duration: {
        type : Number, // in minutes
        required: true,
    },
    genre: {
        type : String,
        required: true,
        enum : ['action' , 'comedy' , 'drama'],
    },
    language: {
        type: String,
        required: true,
        enum : ['english' , 'hindi' , 'tamil' , 'telugu']
    },
    releaseDate: {
        type: Date,
        required : true,
    },
    posterUrl: {
        type: String,
        required: false,
    },
    trailerUrl: {
        type: String,
        required: false,
    },
    certificate: {
        type: String,
        required: true,
        enum : ['U' , 'U/A' , 'A']
    },
    cast: [{
        name: String,
        role: String,
    }],
    director: {
        type : String,
        required: true,
    },
    status: {
        type : String,
        required: true,
        enum : ['Released' , 'upcoming' , 'Archived'],
    },
    isActive: { // for soft deletion or achiving movies
        type: Boolean,
        default: true,
    }

},{
    timestamps: true
})
// Index for searching by title
movieSchema.index({ title: 1, language: 1 }); 
// To quickly list upcoming or released movies by latest release date
movieSchema.index({ status: 1, releaseDate: -1 });
// To support filtering like “all Hindi comedies”:
movieSchema.index({ genre: 1, language: 1 });

export default mongoose.model('Movie', movieSchema)