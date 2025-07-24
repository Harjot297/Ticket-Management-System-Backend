import express from "express";
import { createHallBody } from "../../interfaces/hall_interface/createHallBody";
import mongoose from "mongoose";
import Theatre from "../../schemas/Theatre";
import Seat from "../../schemas/Seat";
import Hall from "../../schemas/Hall";
import redisClient from "../../redisClient";

export const createHall = async (
  req: express.Request<{}, {}, createHallBody>,
  res: express.Response
): Promise<void> => {
  try {
    let {
      theatreId,
      name,
      rows,
      seatsPerRow,
      format,
      regularSeatAmount,
      vipSeatAmount,
      premiumSeatAmount,
    } = req.body;

    // Basic validation
    if (!theatreId || !name || !rows || !seatsPerRow || !format) {
      res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
      return;
    }

    // Validate theatreId
    if (!mongoose.Types.ObjectId.isValid(theatreId)) {
      res.status(400).json({ success: false, message: "Invalid Theatre Id" });
      return;
    }

    // Check if theatre exists and is active
    const theatre = await Theatre.findById(theatreId);
    if (!theatre || !theatre.isActive) {
      res
        .status(404)
        .json({ success: false, message: "Theatre not found or inactive" });
      return;
    }

    if (theatre.owner != req.user.userId) {
      console.log(theatre.owner);
      console.log(req.user.userId);
      res.status(401).json({
        success: false,
        message: "Unauthorized to create hall for this theatre",
      });
      return;
    }

    const existingHall = await Hall.findOne({ theatreId, name });
    if (existingHall) {
      res.status(400).json({
        success: false,
        message: "A hall with this name already exists in the theatre",
      });
      return;
    }

    const totalSeats = rows * seatsPerRow;
    if (vipSeatAmount + regularSeatAmount + premiumSeatAmount !== totalSeats) {
      res.status(400).json({
        success: false,
        message: "Sum of seat amounts must equal total seats",
      });
      return;
    }

    // Create Hall
    const hall = await Hall.create({
      name,
      theatreId,
      rows,
      seatsPerRow,
      format,
      isActive: true,
    });

    // Generate seats
    const seatsArray: any[] = [];
    let count = 0;
    const A_CHAR_CODE = "A".charCodeAt(0);

    for (let i = 0; i < rows; i++) {
      const rowLetter = String.fromCharCode(A_CHAR_CODE + i);
      for (let j = 0; j < seatsPerRow; j++) {
        let seatType = "";
        if (count < regularSeatAmount) seatType = "regular";
        else if (count < regularSeatAmount + vipSeatAmount) seatType = "vip";
        else seatType = "premium";

        seatsArray.push({
          hallId: hall._id,
          theatreId,
          seatNumber: `${rowLetter}${j + 1}`, // e.g., A1, A2
          row: rowLetter,
          type: seatType,
          isAvailable: true,
        });

        count++;
      }
    }

    // Bulk insert seats
    const insertedSeats = await Seat.insertMany(seatsArray);

    hall.seats = insertedSeats.map((seat) => seat._id);
    await hall.save();

    theatre.halls.push(hall._id);
    await theatre.save();

    /** ---------------------------
     * CACHE INVALIDATION
     * ---------------------------
     */
    try {
      await redisClient.del(`erc:theatre:halls:${hall.theatreId}`);
      await redisClient.del(`erc:hall:details:${hall._id}`);
      await redisClient.del(`erc:theatre:details:${hall.theatreId}`);
      await redisClient.del(`erc:theatre:${theatre.owner}`);
      await redisClient.del(`erc:theatres:active`);
      await redisClient.del(`erc:theatre:6873d5c2e576d0b55a8332d9`); // Admin cache
      const keys = await redisClient.keys('erc:halls:all:*');
      if (keys.length > 0) await redisClient.del(keys);
      const seatKeys = await redisClient.keys(`erc:hall:seats:${hall._id}:*`);
      if (seatKeys.length > 0) await redisClient.del(seatKeys);


    } catch (e) {
      console.warn("Cache invalidation failed:", (e as Error).message);
    }


    res.status(200).json({
      success: true,
      message: "Hall Created Successfully",
      data: hall,
    });
    return;
  } catch (err: any) {
    console.log("Error creating Hall for Theatre: ", err.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    return;
  }
};
