import express from "express";
import mongoose from "mongoose";
import Hall from "../../schemas/Hall";
import Seat from "../../schemas/Seat";

export const getHallSeats = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const { hallId } = req.params;
    const { available } = req.query; // e.g., ?available=true

    if (!hallId) {
      res.status(400).json({ success: false, message: "Hall ID is required" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      res.status(400).json({ success: false, message: "Invalid Hall ID" });
      return;
    }

    // Check hall existence
    const hall = await Hall.findById(hallId);
    if (!hall) {
      res.status(404).json({ success: false, message: "Hall not found" });
      return;
    }

    // Build seat query
    const seatQuery: any = { hallId: hall._id };
    if (available !== undefined) {
      seatQuery.isAvailable = available === "true";
    }

    const seats = await Seat.find(seatQuery).lean();

    res.status(200).json({
      success: true,
      message: "Seats fetched successfully",
      data: seats,
    });
  } catch (err: any) {
    console.error("Error fetching hall seats:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
