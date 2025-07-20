import express from 'express'
import Theatre from '../../schemas/Theatre'

export const getActiveTheatres = async (req: express.Request , res: express.Response): Promise<void> => {
    try{
        const theatres = await Theatre.find({ isActive: true , status: 'published'})
        
        if(theatres.length === 0){
            res.status(404).json({
                success: false,
                message: "No active theatres found",
                data: [],
            })
            return;
        }
        res.status(200).json({
            success: true,
            message: "Active theatres retrieved successfully",
            data: theatres
        })
        return;
    }
    catch(err : any){
        console.log("Error displaying Active Theatres : ", err.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
        return;
    }   
}