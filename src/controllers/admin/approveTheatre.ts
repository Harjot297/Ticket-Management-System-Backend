import express from 'express';
import Theatre from '../../schemas/Theatre';
import User from '../../schemas/User';
import  ApproveTheatreBody  from '../../interfaces/approveTheatre';
import mongoose from 'mongoose';
import redisClient from '../../redisClient';

export const approveTheatre = async (
  req: express.Request<{}, {}, ApproveTheatreBody>,
  res: express.Response
) => {
  try {
    const { theatreId } = req.body;

    if (!theatreId) {
      res.status(400).json({
        success: false,
        message: 'Please provide theatreId',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(theatreId)) {
      res.status(400).json({ success: false, message: 'Invalid theatreId' });
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only admins can approve theatres' });
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
      res.status(400).json({ success: false, message: 'Theatre is already approved' });
      return;
    }

    // ✅ Ensure no other active theatre has same name
    const nameConflict = await Theatre.findOne({
      name: theatre.name,
      _id: { $ne: theatre._id },
      status: 'published',
    });
    if (nameConflict) {
      res.status(400).json({
        success: false,
        message: 'Another approved theatre with the same name exists',
      });
      return;
    }

    const userId = theatre.owner;
    if (!userId) {
      res.status(404).json({
        success: false,
        message: 'User (theatre Owner) not found',
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User (theatre Owner) not found',
      });
      return;
    }

    if (user.role !== 'normalUser') {
      res.status(400).json({
        success: false,
        message: 'User is not eligible for upgrade',
      });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      user.role = 'theatreOwner';
      await user.save({ session });

      theatre.status = 'published';
      theatre.verifiedByAdmin = true;
      theatre.isActive = true;
      await theatre.save({ session });

      await session.commitTransaction();

      try {
        await redisClient.del(`erc:theatre:${req.user.userId}`);
        await redisClient.del(`erc:theatre:6873d5c2e576d0b55a8332d9`);

        // For global theatre cache invalidation
        await redisClient.del('erc:theatres:active');

        // For caching theatre/details public route invalidation
        await redisClient.del(`erc:theatre:details:${theatreId}`);

      } catch (e) {
        console.warn('Redis cache invalidation failed:', e.message);
      }


      res.status(200).json({
        success: true,
        message: 'Theatre approved successfully',
        data: { theatre, user },
      });
      return;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err: any) {
    console.error('Error approving theatre:', err);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
    return;
  }
};
