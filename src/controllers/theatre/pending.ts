import express from 'express'
import Theatre from '../../schemas/Theatre';

export const pending = async (req: express.Request, res: express.Response) : Promise<void> => {
    try{
        // Validation will be done in the middleware
        // Pagination details
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page-1)*limit;

        const pendingTheatres = await Theatre.find({status: 'pending'})
        .skip(skip)
        .limit(limit)
        .select('name location.owner createdAt status');

        const total = await Theatre.countDocuments({ status: 'pending' });

        if(pendingTheatres.length === 0){
            res.status(200).json({
                success: true,
                message: "No pending theatres found",
                data:[],
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Pending theatres found",
            data: pendingTheatres,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        })
    }
    catch(err: any){
        console.log("Error displaying pending theatres: " , err);
        res.status(500).json({
            success: false,
            message: "Error displaying pending theatres"
        });
        return;
    }
}