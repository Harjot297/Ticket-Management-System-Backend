// redisClient.ts or redisClient.js
import { createClient } from "redis";

const redisClient = createClient({
  socket: {
    host: "127.0.0.1", // ✅ force IPv4
    port: 6379,        // default Redis port
    connectTimeout: 10000, // 10 sec timeout
  },
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis connected successfully");
  } catch (err) {
    console.error("❌ Redis connection failed:", err);
  }
})();

export default redisClient;
