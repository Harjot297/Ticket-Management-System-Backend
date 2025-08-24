import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import router from "./router/index";
import { rateLimit } from "express-rate-limit";
import fileUpload from "express-fileupload";
import './schemas'; // ensures all models are registered globally
import { movieStatusUpdater } from "./cronJobs/movieStatusUpdater";
import { showStatusUpdater } from "./cronJobs/ShowStatusUpdater";
import { seatStatusUpdater } from "./cronJobs/seatStatusUpdater";



// Load environment variables early, or better yet, define them directly when running each instance.
require("dotenv").config();

// Create the rate limiter middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

// Function to create and configure an Express app instance
const createExpressApp = (serverPort: number, serverName: string) => {
  const app = express();
  process.env.BACKEND_ADDRESS = `127.0.0.1:${serverPort}`;
  app.use(limiter); // Apply rate limiting to each instance

  app.use(
    cors({
      credentials: true,
    })
  );
  app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(bodyParser.json())
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  app.use(cookieParser()); 
  


  // Connect to mongoose (same connection for both, or separate if needed)
  mongoose.connect(process.env.MONGODB_URI);
  mongoose.connection.on("error", () => {
    console.log(`Error Connecting to MongoDB for ${serverName}`);
  });
  mongoose.connection.on("connected", () => {
    console.log(`Successfully connected to MongoDB for ${serverName}`);
  });

  // Use your router for all routes
  app.use("/", router());

  // Basic route to indicate the server instance
  app.get("/", (req, res) => {
    res.send(`Hello from ${serverName}!`);
  });

  // Create and listen to the server
  const server = http.createServer(app);
  server.listen(serverPort, () => {
    console.log(`${serverName} instance successfully running on PORT : ${serverPort}`);
  });

  return app;
};

// Create two separate instances of your Express app
const app1 = createExpressApp(3001, "Server 1");
const app2 = createExpressApp(3002, "Server 2");
console.log("The app is Running on PORT 8080 ") // defined in nginx config
movieStatusUpdater();
showStatusUpdater();
seatStatusUpdater();
/*
  Summary: 
  - This code sets up two separate Express servers with rate limiting, CORS, and MongoDB connections.
  Here , we have two servers running on different ports (3001 and 3002) with a load balancer (Nginx)
  to balance the requests . The load balancer will forward requests to the servers leading to less 
  load on each server and better performance.
  - Each server has its own rate limiter, CORS configuration, and MongoDB connection.
  // Each server can be independently scaled or configured as needed.
  
  NOTE: The information about the backend server is passed in the headers, which can be used for logging or debugging purposes.
  The function `createExpressApp` is reusable for creating multiple instances with different configurations.
  - The servers log the headers received, which can help in debugging and understanding the request flow.
*/

// NOTE: Before starting (npm start) ensure you must start nginx and redis 