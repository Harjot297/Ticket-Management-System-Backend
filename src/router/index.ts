import express from "express";
import { authentication } from "./authentication";
import user from "./user";
import theatre from "./theatre";
import admin from "./admin";
import halls from "./halls";
import movie from "./movie";
import show from "./show";
import booking from "./booking";

const router = express.Router();


export default (): express.Router => {
  authentication(router); 
  user(router);
  theatre(router);
  admin(router);
  halls(router);
  movie(router);
  show(router);
  booking(router);
  return router;
};
