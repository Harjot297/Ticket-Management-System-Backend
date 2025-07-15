import express from "express";

export const isTheatreOrAdmin = async (req : express.Request , res: express.Response , next: express.NextFunction) : Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                message: "Unauthorized access, user not authenticated"
            });
            return;
        }
        const user = req.user;

        if (user.role === "normalUser") {
            res.status(403).json({
                message: "Forbidden access, normal user role not allowed"
            });
            return;
        }

        next();
    } catch (err: any) {
        console.error("Error in isNotUser middleware:", err);
        res.status(500).json({
            message: "Internal server error in isNotUser middleware"
        });
        return;
    }
}