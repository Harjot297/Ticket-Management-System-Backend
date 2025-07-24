import express from 'express';
import Hall from '../../schemas/Hall';

export const getAllHalls = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;

    // Role validation: This will be handled by isAdmin middleware in routes.

    // Aggregate halls with pagination
    const halls = await Hall.aggregate([
      {
        $facet: {
          metaData: [{ $count: 'total' }],
          data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }],
        },
      },
    ]);

    const metaData = halls[0]?.metaData?.[0] || { total: 0 };
    const hallData = halls[0]?.data || [];

    res.status(200).json({
      success: true,
      message: 'Fetched all halls information',
      pagination: {
        page,
        pageSize,
        total: metaData.total,
        totalPages: Math.ceil(metaData.total / pageSize),
      },
      data: hallData,
    });
  } catch (err: any) {
    console.log('Error fetching all halls information: ', err);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};
