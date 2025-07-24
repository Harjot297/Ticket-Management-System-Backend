import mongoose from "mongoose";

// This is the schema for the theatre collection
// The theatre collection will store the details of the theatres

const theatreSchema = new mongoose.Schema({
    name : {
        type : String,
        required: true,
        
    },
    location: {
        city: {
            type: String,
            required: true,
        },
        addressLine: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },
        coordinates: {
            lat: Number,
            lng: Number,
        },
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        
    },
    status: {
        type: String,
        enum: ['pending' , 'published' , 'rejected'],
        default: 'pending',
        required : true,
    },
    rejectionReason: {
        type: String,
        default : null,
        validate: {
            // THis ensures that if the status is rejected then the rejectionReason must be provided
            validator: function (value : any) {
                return this.status !== 'rejected' || (this.status === 'rejected' && !!value);
            },
            message: 'Rejection reason must be provided when status is rejected.',
        },
    },
    verifiedByAdmin : {
        type: Boolean,
        default: false,
    },
    halls: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hall',
    }], // array of all the halls the cinema has  
    isActive: {
        type: Boolean,
        default: true
    }
},{
    timestamps: true, // to avoid adding post middleware for createdAt and updatedAt
});
theatreSchema.index({ "location.coordinates": "2dsphere" });
theatreSchema.index(
  { name: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "published" },
  }
);
export default mongoose.model('Theatre' , theatreSchema);