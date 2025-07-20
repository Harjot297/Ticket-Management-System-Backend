import express from 'express';
import mongoose from 'mongoose';
import Theatre from '../../schemas/Theatre';
import redisClient from '../../redisClient';

export const softDeleteTheatre = async (
  req: express.Request<{ theatreId: string }>,
  res: express.Response
): Promise<void> => {
  try {
    const { theatreId } = req.params;

    // Validate theatreId
    if (!mongoose.Types.ObjectId.isValid(theatreId)) {
      res.status(400).json({ success: false, message: 'Invalid theatreId' });
      return;
    }

    // Fetch theatre
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      res.status(404).json({ success: false, message: 'Theatre not found' });
      return;
    }

    if (req.user.role !== 'admin' && req.user.userId !== theatre.owner) {
        res.status(403).json({ success: false, message: 'You are not authorized to delete this theatre' });
        return;
    }

    if (!theatre.isActive) {
        res.status(400).json({ success: false, message: 'Theatre is already inactive' });
        return;
    }


    // Soft delete
    theatre.isActive = false;
    await theatre.save();

    // Cache invalidation
    try {
      await redisClient.del(`erc:theatre:${theatre.owner}`); // Owner cache
      await redisClient.del(`erc:theatre:${req.user.userId}`); // Current user cache
      // If you have a static admin account ID:
      await redisClient.del(`erc:theatre:6873d5c2e576d0b55a8332d9`); // Replace <ADMIN_ID> if needed

      // For global theatre cache invalidation
      await redisClient.del('erc:theatres:active');
      // For caching theatre/details public route invalidation
      await redisClient.del(`erc:theatre:details:${theatreId}`);
      // for redis cache invalidation for search route so that if its soft deleted , it doesnt appear in search
      await redisClient.keys('erc:theatres:search:*').then(keys => {
        if (keys.length) redisClient.del(keys);
      });

      // for redis cache invalidation for nearby route so that if its soft deleted , it doesnt appear in nearby
      await redisClient.keys('theatres:nearbyTheatres:*').then(keys => {
        if (keys.length > 0) redisClient.del(keys);
      });



    } catch (err) {
      console.warn('Cache invalidation failed:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Theatre soft deleted successfully',
      data: { theatreId, isActive: false },
    });
  } catch (err: any) {
    console.error('Error in soft delete:', err);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};
