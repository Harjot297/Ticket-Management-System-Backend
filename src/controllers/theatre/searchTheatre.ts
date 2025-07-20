import express from 'express'
import Theatre from '../../schemas/Theatre'

export const searchTheatre = async (req: express.Request , res: express.Response) : Promise<void> => {
    try{
        const city = req.query.city as string;
        const name = req.query.name as string;
        if (!city && !name) {
            const theatres = await Theatre.find({ isActive: true, status: 'published' });
            res.status(200).json({
                success : true,
                message: 'All active and published theatres fetched',
                data: theatres
            });
            return;
        }

        const filters: any = {
            isActive: true,
            status: 'published',
        };
        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (city && typeof city === 'string') {
            filters['location.city'] = { $regex: new RegExp(escapeRegex(city), 'i') };
        }
        //NOTE: RegExp(name,i) , name is searched for ex if name = 'new' , then 'new delhi', 'new york'
        // also gets fetched , and i means case insensitive fetching
        if (name && typeof name === 'string') {
            filters.name = { $regex: new RegExp(escapeRegex(name), 'i') };
        }
        const theatres = await Theatre.find(filters);

        if (theatres.length === 0) {
            res.status(404).json({
                success: false,
                message: 'No theatres found matching the criteria',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Theatres fetched successfully',
            data: theatres,
        });
        return;
    }
    catch(err : any){
        console.log('Error in searching for theatre : ' , err);
        res.status(500).json({
            success: false,
            message: 'Error in searching for theatre'
        })
    }
}