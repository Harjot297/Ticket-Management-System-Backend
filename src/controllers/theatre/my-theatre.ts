import express from 'express'

import Theatre from '../../schemas/Theatre'
// require('../../schemas/Hall'); // CommonJS require ensures execution

export const myTheatre = async (req: express.Request , res: express.Response) : Promise<void> => {
    try{
        const userId = req.user.userId;
        if(req.user.role !== 'theatreOwner'){
            res.status(403).json({
                success: false,
                message: 'Access denied. Only theatre owners can access this.'
            })
            return;
        }

          const theatre = await Theatre.findOne({ owner: userId }).populate('halls')
            .select('name location status halls isActive');
        
        if(!theatre){
            res.status(404).json({
                success: false,
                message: 'Theatre not found'
            })
            return;
        }
        // return response
        res.status(200).json({
            success: true,
            data: theatre
        })
        return;
    }
    catch(err : any){
        console.log("Error showing theatre Details : " , err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}