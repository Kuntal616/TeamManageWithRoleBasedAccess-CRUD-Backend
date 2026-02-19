import type { Request, Response } from "express";
import { Role, type User } from "../types/index.js";
import crypto from "crypto";
import {
  generateToken,
  hashedPassword,
  verifyPassword,
  CheckUserAuth,
} from "../lib/auth.js";
import { prisma } from "../lib/db.js";
import cookieOptions from "../lib/cookie.config.js";
import { error } from "console";

// User Registration
export const handleRegister = async (req: Request, res: Response) => {
  try {
    const { name, email, password, teamCode } = req.body;
    // validate input
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name,email and password are required or not valid" });
    }
    // check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }
    //team association if team code is provided
    let teamId: string | undefined;
    if (teamCode) {
      const team = await prisma.team.findUnique({
        where: { code: teamCode },
      });
      if (!team) {
        return res.status(400).json({ error: "Invalid team code" });
      }
      teamId = team.id;
    }
    // create user
    const hashPassword = await hashedPassword(password);
    const userCount = await prisma.user.count(); // to check if first user
    const role = userCount === 0 ? Role.ADMIN : Role.USER;
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword,
        passwordChangedAt: new Date(),
        role,
        ...(teamId && {
          team: { connect: { id: teamId } },
        }),
      },
      include: {
        team: true,
      },
    });

    // generate token for that user
    const token = generateToken(newUser.id);

    // respond with user data and set cookie
    return res
      .cookie("access_token", token, cookieOptions)
      .status(201)
      .json({
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          team: newUser.team,
          teamId: newUser.teamId,
          token, // include token in response body for the development convenience
        },
        message: "Registration successful",
      });
  } catch (error) {
    console.error("Error in handleRegister:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// User Login
export const handleLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    //validate input
    if (!email || !password) {
      return res.json({ error: "Email and password are required" }).status(400);
    }
    //check if user exists
    const userFromDb = await prisma.user.findUnique({
      where: { email },
      include: { team: true },
    });
    if (!userFromDb) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    //verify password
    const isPasswordValid = await verifyPassword(password, userFromDb.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    //if admin changed the password then force user to change password on the login
    if (userFromDb.mustChangePassword) {
      return res.status(403).json({
        error: "Password must be changed, Please change your password",
      });
    }
    //generate token
    const token = generateToken(userFromDb.id);
    // respond with user data and set cookie
    return res
      .cookie("access_token", token, cookieOptions)
      .status(200)
      .json({
        user: {
          id: userFromDb.id,
          name: userFromDb.name,
          email: userFromDb.email,
          role: userFromDb.role,
          team: userFromDb.team,
          teamId: userFromDb.teamId,
          token, // include token in response body for the development convenience
        },
        message: "Login successful",
      });
  } catch (error) {
    console.error("Error in handleLogin:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// User Logout
export const handleLogout = async (req: Request, res: Response) => {
  return res
    .clearCookie("access_token", cookieOptions)
    .status(200)
    .json({ message: "Logout successful" });
};

export const handleChangePassword = async (req: Request, res: Response) => {
  try {
    const user = await CheckUserAuth(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const userFromDB = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userFromDB) {
      return res.status(404).json({ error: "User not found" });
    }
    const isPasswordValid = await verifyPassword(
      currentPassword,
      userFromDB.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    const hashedNewPassword = await hashedPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword, passwordChangedAt: new Date() },
    });
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error in handleChangePassword:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const handleForgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (!user) {
      return res
        .status(200)
        .json({ message: "If the email exists, a reset link will be sent" });
    }
    //generate the reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedResetToken,
        resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    // later I will add the email sending sunctionality here using nodemailer or any other email service
    console.log(
      `Password reset token for ${email}: http://localhost:${process.env.PORT || 3000}/api/auth/reset-password?token=${resetToken}`,
    );
    return res.status(200).json({
      message: "If email esist a reset link will be send to the mail",
    });
  } catch (error) {
    console.log("Error in handleForgotPassword:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const handleResetPassword = async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const { token } = req.query as { token?: string };

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedResetToken,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: " Invalid or expired token" });
    }
    const hashedNewPassword = await hashedPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        resetToken: null,
        resetTokenExpiry: null,
        passwordChangedAt: new Date(),
      },
    });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.log("Error in handleResetPassword:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const handleForceChangePassword = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email, newPassword, password } = req.body;
    const tempPassword = password; // temporary password sent by admin to the user
    if (!email || !newPassword || !tempPassword)
      return res.status(400).json({ error: "All fields are required" });
    const user = await prisma.user.findUnique({
      where: { email: email },
      include: { team: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }
    const isValid = await verifyPassword(tempPassword, user.password);
    if (!isValid)
      return res.status(401).json({ error: "Incorrect Temporary Password" });
    const hashedNewPassword = await hashedPassword(newPassword);
    await prisma.user.update({
      data: {
        password: hashedNewPassword,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
      where: { id: user.id },
    });

    //generate token
    const token = generateToken(user.id);
    // respond with user data and set cookie
    return res
      .cookie("access_token", token, cookieOptions)
      .status(200)
      .json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          team: user.team,
          teamId: user.teamId,
          token, // include token in response body for the development convenience
        },
        message: "Login successful after password change",
      });
  } catch (error) {
    console.error("Error in handleForceChangePassword:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
