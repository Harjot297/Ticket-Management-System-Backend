import express from "express";
import mongoose from "mongoose";
import Hall from "../../schemas/Hall";
import Seat from "../../schemas/Seat";
import Theatre from "../../schemas/Theatre";
import redisClient from "../../redisClient";

export const updateHall = async (
  req: express.Request<{ hallId: string }, {}, Partial<any>>,
  res: express.Response
): Promise<void> => {
  try {
    const { hallId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(hallId)) {
      res.status(400).json({ success: false, message: "Invalid Hall Id" });
      return;
    }

    // Fetch hall
    const hall = await Hall.findById(hallId);
    if (!hall) {
      res.status(404).json({ success: false, message: "Hall not found" });
      return;
    }

    // Fetch theatre to validate owner
    const theatre = await Theatre.findById(hall.theatreId);
    if (!theatre) {
      res.status(404).json({ success: false, message: "Theatre not found" });
      return;
    }

    if (req.user.role !== "admin" && req.user.userId.toString() !== theatre.owner.toString()) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to update this hall",
      });
      return;
    }

    let { name, rows, seatsPerRow, format, regularSeatAmount, vipSeatAmount, premiumSeatAmount } =
      req.body;

    // Apply updates
    if (name && name !== hall.name) {
      const duplicateHall = await Hall.findOne({ theatreId: hall.theatreId, name });
      if (duplicateHall) {
        res.status(400).json({
          success: false,
          message: "Another hall with this name already exists in this theatre",
        });
        return;
      }
      hall.name = name;
    }

    if (format) hall.format = format;

    // Update rows/seats only if provided
    let shouldRegenerateSeats = false;
    if (rows || seatsPerRow || regularSeatAmount || vipSeatAmount || premiumSeatAmount) {
      rows = rows || hall.rows;
      seatsPerRow = seatsPerRow || hall.seatsPerRow;
      regularSeatAmount = Number(regularSeatAmount || 0);
      vipSeatAmount = Number(vipSeatAmount || 0);
      premiumSeatAmount = Number(premiumSeatAmount || 0);

      const totalSeats = rows * seatsPerRow;

      // If seat amounts not provided, distribute evenly or fallback
      if (regularSeatAmount + vipSeatAmount + premiumSeatAmount === 0) {
        // Fallback logic: default all to regular
        regularSeatAmount = totalSeats;
        vipSeatAmount = 0;
        premiumSeatAmount = 0;
      }

      if (regularSeatAmount + vipSeatAmount + premiumSeatAmount !== totalSeats) {
        res.status(400).json({
          success: false,
          message: "Sum of regular, VIP, and premium seat amounts must match total seats",
        });
        return;
      }

      hall.rows = rows;
      hall.seatsPerRow = seatsPerRow;
      shouldRegenerateSeats = true;
    }

    // Save hall first
    await hall.save();

    // Regenerate seats if needed
    if (shouldRegenerateSeats) {
      await Seat.deleteMany({ hallId: hall._id });

      const seatsArray: any[] = [];
      let count = 0;
      const A_CHAR_CODE = "A".charCodeAt(0);

      for (let i = 0; i < hall.rows; i++) {
        const rowLetter = String.fromCharCode(A_CHAR_CODE + i);
        for (let j = 0; j < hall.seatsPerRow; j++) {
          let seatType = "";
          if (count < regularSeatAmount) seatType = "regular";
          else if (count < regularSeatAmount + vipSeatAmount) seatType = "vip";
          else seatType = "premium";

          seatsArray.push({
            hallId: hall._id,
            theatreId: hall.theatreId,
            seatNumber: `${rowLetter}${j + 1}`,
            row: rowLetter,
            type: seatType,
            isAvailable: true,
          });

          count++;
        }
      }

      const insertedSeats = await Seat.insertMany(seatsArray);
      hall.seats = insertedSeats.map((seat) => seat._id);
      await hall.save();
    }

    /** ---------------------------
     * CACHE INVALIDATION
     * --------------------------- */
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
      message: "Hall updated successfully",
      data: hall,
    });
  } catch (err: any) {
    console.error("Error updating hall:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
