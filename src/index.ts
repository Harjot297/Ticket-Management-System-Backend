import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import cors from "cors"
import http from "http"
import router from "./router/index"
import { rateLimit } from 'express-rate-limit'

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
})

const app = express(); // create express app

app.use(limiter);

app.use(cors({
    credentials: true,
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

require("dotenv").config();

// create server
const server = http.createServer(app);

// listen to port
server.listen(process.env.PORT , () => {
    console.log(`Server running on PORT : ${process.env.PORT}`);
})

// connect to mongoose
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error' , () => {
    console.log("Error Connecting to MongoDB");
})
mongoose.connection.on('connected' , () => {
    console.log("Successfuly connected to mongoDB");
})

app.use("/" , router());

app.get("/", (req,res) => {
    return res.status(200).json({
        message: "App Successfully running"
    })
})



