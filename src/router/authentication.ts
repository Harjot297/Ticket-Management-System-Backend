import express from "express";
import { register } from "../controllers/authentication/signup";
import { login } from "../controllers/authentication/login";
import { auth } from "../middlewares/auth";

export const authentication = (router: express.Router) => {
  router.post("/signup", register);
  router.post("/login", login);
  
  router.get("/temp", (req: express.Request, res: express.Response) => {
    console.log(req.headers);
    res.status(200).json({
      message: "This is a protected route",
      user: (req as any).user, // This will contain userId, sessionId, email, role
    });
  });


};
