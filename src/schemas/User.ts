import mongoose from "mongoose";

// In our movie management system , this is the user schema which will be for normal users or admins
// or theatre owners ...admin can manage all users and theatres and assign a user to a theatre
// Theatre owner can manage only his theatre and users assigned to it
// Normal user can only book tickets and view movies


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type : String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    authentication: {
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false // Do not return password in queries by default
        },
        salt: {
            type: String,
            required: true,
            select: false // Do not return salt in queries by default
        },
        sessionId: {
            type: String,
            select: false // DO not return sessionId in queries by default
        },
    },
    role: {
        type: String,
        enum: ['admin' , 'theatreOwner' , 'normalUser'],
        default: 'normalUser',
        required: true
    },
    
    // __v: {
    //     type: Number,
    //     select: false // Do not return version key in queries by default
    // },

}, {
    timestamps: true,
});

export default mongoose.model('User',userSchema);
