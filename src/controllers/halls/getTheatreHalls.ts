import express from 'express';
import mongoose from 'mongoose';
import Theatre from '../../schemas/Theatre';
import Hall from '../../schemas/Hall';

export const getTheatreHalls = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { theatreId } = req.params;

    if (!theatreId) {
      res.status(400).json({ success: false, message: "Theatre id is required" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(theatreId)) {
      res.status(400).json({ success: false, message: "Invalid theatre id" });
      return;
    }

    // Fetch theatre
    const theatre = await Theatre.findById(theatreId);
    if (!theatre) {
      res.status(404).json({ success: false, message: "Theatre not found" });
      return;
    }

    // Fetch all active halls of this theatre
    const activeHalls = await Hall.find({
      _id: { $in: theatre.halls },
      isActive: true,
    });

    res.status(200).json({
      success: true,
      message: "Theatre halls fetched successfully",
      data: activeHalls,
    });
  } catch (err: any) {
    console.log("Error fetching theatre halls: ", err);
    res.status(500).json({
      success: false,
      message: "Error fetching theatre halls",
    });
  }
};
