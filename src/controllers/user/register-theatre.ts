import express from "express";
import Theatre from "../../schemas/Theatre";
import RegisterTheatreBody from "../../interfaces/registerTheatre";
import { delPattern } from "../../helpers/redisCache";

export const registerTheatre = async (
  req: express.Request<{}, {}, RegisterTheatreBody>,
  res: express.Response
): Promise<void> => {
  try {
    let { name, location } = req.body;

    name = name.trim();
    location.city = location.city.trim();
    location.addressLine = location.addressLine.trim();
    location.pincode = location.pincode.trim();

    if (!name || !location) {
      res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
      return;
    }

    if (
      !location.city ||
      !location.addressLine ||
      !location.pincode ||
      !location.coordinates
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide all required fields for location",
      });
      return;
    }

    if (
      typeof location.coordinates.lat !== "number" ||
      typeof location.coordinates.lng !== "number"
    ) {
      res.status(400).json({ success: false, message: "Invalid coordinates" });
      return;
    }

    if (!/^\d{6}$/.test(location.pincode)) {
      res.status(400).json({ success: false, message: "Invalid pincode" });
      return;
    }

    if (!req.user.userId) {
      res.status(401).json({
        success: false,
        message: "Cannot find User, please login again",
      });
      return;
    }

    if (req.user.role !== "normalUser") {
      res
        .status(403)
        .json({
          success: false,
          message: "Only normal users can request theatre registration",
        });
      return;
    }

    const existingTheatre = await Theatre.findOne({ owner: req.user.userId });
    if (existingTheatre) {
      res.status(400).json({
        success: false,
        message: "You already have a theatre registered or pending approval",
      });
      return;
    }

    // ✅ Allow theatre name reuse if the previous theatre with same name is rejected
    const theatreNameConflict = await Theatre.findOne({
      name,
      status: { $ne: "rejected" }, // Only block if status is not rejected
    });
    if (theatreNameConflict) {
      res.status(400).json({
        success: false,
        message:
          "Theatre name is already in use by another active/pending theatre",
      });
      return;
    }

    const theatre = await Theatre.create({
      name,
      location,
      owner: req.user.userId,
      status: "pending",
      verifiedByAdmin: false,
      halls: [],
      isActive: false,
    });

    try {
      await delPattern("erc:bookings:*");
      await delPattern("erc:bookings:show:*");
    } catch (err: any) {
      console.log("Error in cache invalidation:", err);
    }

    res.status(201).json({
      success: true,
      message:
        "Theatre creation request successfully, wait until admin confirms your request",
      data: theatre,
    });
    return;
  } catch (err: any) {
    console.log(err);

    if (err.code === 11000) {
      res
        .status(400)
        .json({ success: false, message: "Theatre name already exists" });
      return;
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to process request for theatre creation, try again later",
    });
    return;
  }
};
