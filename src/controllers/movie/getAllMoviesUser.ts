import { Request, Response } from "express";
import Movie from "../../schemas/Movie";

export const getAllMoviesPublic = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize
      ? parseInt(req.query.pageSize as string)
      : 10;
    const genre = req.query.genre ? (req.query.genre as string) : "";
    const language = req.query.language ? (req.query.language as string) : "";

    const movies = await Movie.aggregate([
      {
        $match: {
          isActive: true,
          ...(genre && { genre: { $in: [genre] } }),
          ...(language && { language: { $in: [language] } }),
        },
      },
      {
        $facet: {
          metadata: [{ $count: "totalCount" }],
          data: [
            { $sort: { releaseDate: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
          ],
        },
      },
    ]);

    const metaData = movies[0]?.metadata?.[0] || { totalCount: 0 };
    const moviesData = movies[0]?.data || [];

    res.status(200).json({
      success: true,
      message: "Movies Data Fetched Successfully",
      pagination: {
        page,
        pageSize,
        total: metaData.totalCount,
        totalPages: Math.ceil(metaData.totalCount / pageSize),
      },
      data: moviesData,
    });
    return;
  } catch (err: any) {
    console.log("Error Getting Movies Data : ", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
    return;
  }
};
