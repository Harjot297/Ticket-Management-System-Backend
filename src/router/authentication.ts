import express from "express";
import { register } from "../controllers/authentication/signup";
import { login } from "../controllers/authentication/login";
import { auth } from "../middlewares/auth";
import { isAdmin } from "../middlewares/isAdmin";
import { isTheatreOrAdmin } from "../middlewares/isTheatreOrAdmin";
import  {userScopedCache} from "../helpers/redisCache" 
import { logout } from "../controllers/authentication/logout";
import { changePassword } from "../controllers/authentication/changePassword";
import { resetAccessToken } from "../controllers/authentication/resetAccessToken";


export const authentication = (router: express.Router) => {
  router.post("/signup", register);
  router.post("/login", login);
  router.post('/logout' , auth , logout)
  router.post('/changePassword' , auth , changePassword)
  router.post('/resetAccessToken' , resetAccessToken)

  
  
  router.get("/temp", auth ,isTheatreOrAdmin,  userScopedCache("temp"), (req: express.Request, res: express.Response) => { 
    // cache.route() will cache the response for this route
    console.log("Coming from server , not cache");
    console.log("Request user" , req?.user);
    res.status(200).json({
      message: "This is a protected route",
      user: req?.user, // This will contain userId, sessionId, email, role
    });
  });


};
