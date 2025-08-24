import express from 'express'
import UpdateTheatreBody from '../../interfaces/updateTheatre'
import Theatre from '../../schemas/Theatre';
import redisClient from '../../redisClient';
import { delPattern } from '../../helpers/redisCache';
import Show from '../../schemas/Show';

export const updateTheatre = async (req : express.Request<{},{},UpdateTheatreBody> , res: express.Response) : Promise<void> => {
    try{
        let {name , location } = req.body;

        if (!name || !location) {
            res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
            return;
        }

        if (!location.city || !location.addressLine || !location.pincode || !location.coordinates) {
            res.status(400).json({
                success: false,
                message: 'Please provide all required fields for location',
            });
            return;
        }

        if (typeof location.coordinates.lat !== 'number' || typeof location.coordinates.lng !== 'number') {
            res.status(400).json({ success: false, message: 'Invalid coordinates' });
            return;
        }

        if (!/^\d{6}$/.test(location.pincode)) {
            res.status(400).json({ success: false, message: 'Invalid pincode' });
            return;
        }

        name = name.trim();
        location.city = location.city.trim();
        location.addressLine = location.addressLine.trim();
        location.pincode = location.pincode.trim();

        if (!req.user.userId) {
            res.status(401).json({
                success: false,
                message: 'Cannot find User, please login again',
            });
            return;
        }

        // role check
        

        // theatre fetch
        const theatre = await Theatre.findOne({owner: req.user.userId});

        if (!theatre) {
            res.status(404).json({ success: false, message: 'Theatre not found' });
            return;
        }

        const existing = await Theatre.findOne({ name, status: 'published', _id: { $ne: theatre._id } });
        if (existing) {
            res.status(400).json({ success: false, message: 'Theatre name already exists' });
            return;
        }



        if(theatre.status !== 'pending'){
            res.status(403).json({
                success: false,
                message: 'Your theatre is already published and details cant be updated',
            })
            return;
        }

        theatre.name = name;
        theatre.location = location;
        await theatre.save(); 

        /*
            [SimpleError: MISCONF Redis is configured to save RDB snapshots, but is currently not able to 
            persist on disk. Commands that may modify the data set are disabled. 
            Please check Redis logs for details about the error.]

            If this error comes , you need to disable persistance from redis: 
            Go to redis cli and type : config set save "" 
            This command disables persistance in development environment

        */

        // erc: is REDIS PREFIX WHICH IT BY DEFAULT USES
        try {

            // invalidate hall:details:${hallId} also , as in hall details route we're populating theatreDetails too
            for(const hall of theatre.halls){
                await redisClient.del(`hall:details:${hall}`);
            }

            await redisClient.del(`erc:theatre:${theatre.owner}`);
            await redisClient.del(`erc:theatre:${req.user.userId}`);
            // admin ID cache validation
            await redisClient.del(`erc:theatre:6873d5c2e576d0b55a8332d9`);

            // For global theatre object cache invalidation 
            await redisClient.del('erc:theatres:active');

            // For caching theatre/details public route invalidation
            await redisClient.del(`erc:theatre:details:${theatre._id}`);

            // For caching theatre/search by city nd name route invalidation
            await redisClient.del(`theatres:search:city=${location.city.toString().toLowerCase()}|name=${name.toString().toLowerCase()}`)
            // for redis cache invalidation for nearby route so that if its soft deleted , it doesnt appear in nearby
            await redisClient.keys('theatres:nearbyTheatres:*').then(keys => {
                if (keys.length > 0) redisClient.del(keys);
            });
            await delPattern("erc:shows:movie:*");
            await delPattern("erc:shows:theatre:*");

            // fetch shows of this theatre and invalidate
            const shows = await Show.find({theatreId: theatre._id});
            for(const show of shows){
                await redisClient.del(`erc:show:details:${show._id}`);
            }

            await delPattern("erc:bookings:user:*");
            await delPattern("erc:bookings:*");

        } catch (e) {
            console.warn('Redis cache invalidation failed:', e.message);
        }


        res.status(200).json({
            success: true,
            message: 'Theatre details updated successfully',
            data: theatre,
        })

        return;


    }
    catch(err: any){
        console.log(err);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
        return;
    }
}