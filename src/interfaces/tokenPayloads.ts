import mongoose from "mongoose";

export interface refreshTokenPayload {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
}

export interface accessTokenPayload {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  email: string;
  role?: string; // Optional, if you want to include role in access token
}
