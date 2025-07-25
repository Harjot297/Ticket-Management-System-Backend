import express from 'express'
import mongoose from 'mongoose';
import Hall from '../../schemas/Hall';

export const getHallDetails = async (req : express.Request , res: express.Response) : Promise<void> => {
    try{
        const {hallId} = req.params;
        if(!hallId){
            res.status(400).json({success : false, message: 'Hall Id is required'})
            return;
        }
        if(!mongoose.Types.ObjectId.isValid(hallId)){
            res.status(400).json({success : false, message: 'Invalid Hall Id'})
            return;
        } 
        // now get hall details 
        const hall = await Hall.findById(hallId).populate('theatreId').then( doc => {
            if(doc && doc.isActive){
                return doc.populate('seats');
            }
            return doc;
        }).catch((err ) :any => {
            console.log("Error getting hall details : " , err);
            return null;
        });

        if(!hall){
            res.status(404).json({success : false, message: 'Hall not found'})
            return;
        }

        res.status(200).json({
            success: true,
            message: "Hall details Fetched",
            data: hall
        })
        return;
    }
    catch(err : any){
        console.log("Error getting hall Details : " , err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
        return;
    }

}