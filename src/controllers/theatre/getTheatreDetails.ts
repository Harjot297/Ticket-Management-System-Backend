import express from 'express';
import Theatre from '../../schemas/Theatre';
import mongoose from 'mongoose';

export const getTheatreDetails = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { theatreId } = req.params;

    if (!theatreId || !mongoose.Types.ObjectId.isValid(theatreId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid or missing Theatre Id',
      });
      return;
    }

    const theatre = await Theatre.findOne({
      _id: theatreId,
      isActive: true,
      status: 'published',
    });

    if (!theatre) {
      res.status(404).json({
        success: false,
        message: 'Theatre not found or not available',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Theatre details fetched successfully',
      data: theatre,
    });
  } catch (err: any) {
    console.error('Error fetching specific theatre details:', err);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error. Cannot fetch theatre details.',
    });
  }
};
