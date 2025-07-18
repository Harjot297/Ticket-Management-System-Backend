import express from 'express';
import mongoose from 'mongoose';
import RejectTheatre  from '../../interfaces/rejectTheatre';
import Theatre from '../../schemas/Theatre';
import redisClient from '../../redisClient';
export const rejectTheatre = async (
  req: express.Request<{}, {}, RejectTheatre>,
  res: express.Response
): Promise<void> => {
  try {
    const { reason, theatreId } = req.body;

    if (!theatreId || !reason.trim()) {
      res.status(400).json({
        success: false,
        message: 'Please provide theatreId and reason',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(theatreId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid theatreId',
      });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only admins can reject theatres',
      });
      return;
    }

    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      res.status(404).json({
        success: false,
        message: 'Theatre not found',
      });
      return;
    }

    if (theatre.status === 'published') {
      res.status(400).json({
        success: false,
        message: 'Cannot reject an already approved theatre',
      });
      return;
    }

    theatre.status = 'rejected';
    theatre.rejectionReason = reason.trim();
    theatre.verifiedByAdmin = false;
    theatre.isActive = false;

    await theatre.save();

    try {
      await redisClient.del(`erc:theatre:${req.user.userId}`);
    } catch (e) {
      console.warn('Redis cache invalidation failed:', e.message);
    }
    res.status(200).json({
      success: true,
      message: 'Theatre rejected successfully',
      data: theatre,
    });
  } catch (err: any) {
    console.error('Error rejecting the theatre request:', err);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};
