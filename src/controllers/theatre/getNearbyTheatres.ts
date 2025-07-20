import express from 'express';
import Theatre from '../../schemas/Theatre';

export const getNearbyTheatres = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string); // in km

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      res.status(400).json({
        success: false,
        message: 'lat, lng, and radius (in km) are required and must be valid numbers.',
      });
      return;
    }

    const theatres = await Theatre.find({
      isActive: true,
      status: 'published',
      'location.coordinates': {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius / 6378.1], // radius in radians
        },
      },
    });

    if (theatres.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No nearby theatres found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: theatres,
    });
  } catch (err: any) {
    console.error('Error getting nearby theatres:', err);
    res.status(500).json({
      success: false,
      message: 'Error getting nearby theatres',
    });
  }
};
