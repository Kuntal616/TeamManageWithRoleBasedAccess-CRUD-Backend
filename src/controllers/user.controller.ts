import type { Request, Response } from "express";
import { Role, type User } from "../types/index.js";
import {
  checkUserPermission,
  generateToken,
  hashedPassword,
  MAX_ADMINS,
  verifyPassword,
  CheckUserAuth,
} from "../lib/auth.js";
import { prisma } from "../lib/db.js";
import cookieOptions from "../lib/cookie.config.js";
import type { Prisma } from "../generated/prisma/client.js";

// Get Current Authenticated User

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await CheckUserAuth(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getCurrUser:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

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
// Get Users with Role-Based Access Control
export const handleUsers = async (req: Request, res: Response) => {
  try {
    const user: User | null = await CheckUserAuth(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const getParams = req.query;
    const teamId = getParams.teamId;
    const role = getParams.role;
    //build where clause based on user role
    const where: Prisma.UserWhereInput = {};
    if (user.role === Role.ADMIN) {
      //admin can see all users
    } else if (user.role === Role.MANAGER) {
      //manager can see users in their team only can't see other managers or admins
      if (!user.teamId) {
        return res.status(403).json({ error: "Manager has no team" });
      }
      where.OR = [{ teamId: user.teamId }, { role: Role.USER }];
    } else {
      //regular user can see only themselves
      if (!user.teamId) {
        return res.status(403).json({ error: "User has no team" });
      }
      where.teamId = user.teamId;
      where.role = { not: Role.ADMIN };
    }

    //additional filters

    if (teamId) {
      where.teamId = teamId as string;
    }
    if (role) {
      where.role = role as Role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error in handleUser:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// Assign Team to User with Admin-Only Access
export const handleUsersTeamAssign = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await CheckUserAuth(req);
    if (!user || !checkUserPermission(user, Role.ADMIN)) {
      return res
        .status(401)
        .json({ error: "You are not authorized to assign team" });
    }
    //only admin can assign team
    // checking team code are valid or not
    const { teamCode } = req.body;
    let teamId: string | null = null;
    if (!teamCode) {
      return res.status(400).json({ error: "teamCode is required" });
    }

    if (teamCode) {
      const team = await prisma.team.findUnique({
        where: { code: teamCode },
      });
      if (!team) {
        return res.status(404).json({ error: "Team code not found" });
      }
      teamId = team.id;
    }
    const { password, ...updatedUser } = await prisma.user.update({
      where: { id: userId as string },
      data: {
        teamId: teamId,
      },
      include: {
        team: true,
      },
    });
    return res.status(200).json({
      user: updatedUser,
      message: teamId
        ? "User assigned to team successfully"
        : "user removed from team successfully",
    });
  } catch (error) {
    console.error("Error in handleUsersTeamAssign:", error);
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found.")
    ) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
// Assign Role to User with Admin-Only Access
export const handleUsersRoleAssign = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await CheckUserAuth(req);
    if (!user || !checkUserPermission(user, Role.ADMIN)) {
      return res
        .status(401)
        .json({ error: "You are not authorized to assign role" });
    }
    if (user.id === userId) {
      return res.status(400).json({ error: "You cannot change your own role" });
    }

    const { role } = req.body as { role: Role };
    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }
    if (!Object.values(Role).includes(role)) {
      return res.status(400).json({ error: "Invalid role value" });
    }
    const { password, ...updatedUser } = await prisma.$transaction(
      async (tx) => {
        const adminCount = await tx.user.count({ where: { role: Role.ADMIN } });
        if (adminCount >= MAX_ADMINS && role === Role.ADMIN) {
          throw new Error(`Cannot assign more than ${MAX_ADMINS} admins`);
        }
        // Prevent demoting the last admin
        const userToUpdate = await tx.user.findUnique({
          where: { id: userId as string },
        });
        if (userToUpdate?.role === Role.ADMIN && role !== Role.ADMIN) {
          if (adminCount <= 1) {
            throw new Error("Cannot demote the last admin user");
          }
        }
        return await tx.user.update({
          where: { id: userId as string },
          data: { role },
        });
      }
    );
    return res
      .status(200)
      .json({ user: updatedUser, message: "User role updated successfully" });
  } catch (error) {
    console.error("Error in handleUsersRoleAssign:", error);
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found.")
    ) {
      return res.status(404).json({ error: "User not found" });
    } else if (
      error instanceof Error &&
      error.message.includes("Cannot assign more than")
    ) {
      return res.status(400).json({ error: error.message });
    } else if (
      error instanceof Error &&
      error.message.includes("Cannot demote the last admin user")
    ) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
