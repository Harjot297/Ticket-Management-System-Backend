import express from "express";
import { hashPassword, randomString } from "../../helpers/index";
import User from "../../schemas/User";

export const register = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    // This is the register controller which will be used to register a new user
    // We will get name , email , password , confirmPassword
    const allowedAdminEmail = "admin@admin.com";
    const { name, email, password, confirmPassword } = req.body;
    const role = (email === allowedAdminEmail) ? "admin" : "normalUser";


    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({
        message:
          "Please provide all required fields: name, email, password, confirmPassword.",
      });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({
        message: "Passwords do not match.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email format." });
      return;
    }

    // check if user already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      res.status(400).json({
        message: "user already exists with this email, please sign in",
      });
      return;
    }
    // user does not exist so create a user
    // create a salt
    const salt = randomString();

    // has the password with the salt
    const hashedPassword = hashPassword(salt, password);

    const newUser = new User({
      name: name,
      email: email.toLowerCase(),
      authentication: {
        password: hashedPassword,
        salt: salt,
        // sessionId will be created when we do sign in
      },
      role: role,
    });

    await newUser.save();

    res.status(201).json({
      user: newUser,
      message: "User registered successfully",
    });

    return;
  } catch (err) {
    console.log("Error in register controller: ", err);
    res.status(500).json({
      message: "Error signing you up, please try again later",
    });
    return;
  }
};
