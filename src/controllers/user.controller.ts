import type { Request, Response } from "express";
import { Role } from "../types/index.js";
import {
  checkUserPermission,
  MAX_ADMINS,
  CheckUserAuth,
  hashedPassword,
} from "../lib/auth.js";
import { prisma } from "../lib/db.js";
import type { Prisma } from "../generated/prisma/client.js";
import crypto from "crypto";

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

// Get Users with Role-Based Access Control
export const handleUsers = async (req: Request, res: Response) => {
  try {
    const user = await CheckUserAuth(req);
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
      where.teamId = user.teamId;
      where.role = Role.USER;
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
    if (!teamCode) {
      return res.status(400).json({ error: "teamCode is required" });
    }

    const team = await prisma.team.findUnique({
      where: { code: teamCode },
    });
    if (!team) {
      return res.status(404).json({ error: "Team code not found" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { teamId: true, role: true },
    });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (targetUser.role === Role.ADMIN) {
      return res
        .status(400)
        .json({ error: "Cannot assign team to an admin user" });
    }
    if (targetUser.teamId !== null) {
      return res.status(400).json({
        error:
          "User already belong to a team, Please remove from the current team before assigning to a new one",
      });
    }
    const { password, ...updatedUser } = await prisma.user.update({
      where: { id: userId as string },
      data: {
        team: {
          connect: { id: team.id },
        },
      },
      include: {
        team: true,
      },
    });
    return res.status(200).json({
      user: updatedUser,
      message: teamCode
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
        const updateData: Prisma.UserUpdateInput = { role };
        if (role === Role.ADMIN) {
          updateData.team = { disconnect: true }; //admins don't belong to any team
          // disconnect mainly sets the teamId to null here
        }
        return await tx.user.update({
          where: { id: userId as string },
          data: updateData,
        });
      },
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

// Remove User from Team with Admin-Only Access
export const handleUserRemoveFromTeam = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await CheckUserAuth(req);
    if (!user || !checkUserPermission(user, Role.ADMIN)) {
      return res
        .status(401)
        .json({ error: "You are not authorized to remove user from team" });
    }
    const targetUser = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { teamId: true, role: true },
    });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (targetUser.role === Role.ADMIN) {
      return res
        .status(400)
        .json({ error: "Admin does not belongs to any team" });
    }
    if (targetUser.teamId === null) {
      return res
        .status(400)
        .json({ error: "User does not belong to any team" });
    }
    const { password, ...updatedUser } = await prisma.user.update({
      where: { id: userId as string },
      data: { team: { disconnect: true } },
    });
    return res.status(200).json({
      user: updatedUser,
      message: "User removed from team successfully",
    });
  } catch (error) {
    console.error("Error in handleUserRemoveFromTeam:", error);
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found.")
    ) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const handleAdminResetUserPassword = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId } = req.params as { userId: string };
    const user = await CheckUserAuth(req);
    if (!user || !checkUserPermission(user, Role.ADMIN)) {
      return res
        .status(401)
        .json({ error: "You are not authorized to reset user password" });
    }
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    const temporaryPassword = crypto.randomBytes(8).toString("hex");
    const hashedTempPassword = await hashedPassword(temporaryPassword);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedTempPassword,
        mustChangePassword: true,
      },
    });
    // share the temporary password with admin through response or email in real application but here we will log it in the console for testing purpose
    console.log(
      `Temporary password for user ${targetUser.email}: ${temporaryPassword}`,
    );
    return res.status(200).json({
      message:
        "User password has been reset. Temporary password is logged in the server console.",
    });
  } catch (error) {
    console.error("Error in handleAdminResetUserPassword:", error);
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found.")
    ) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};
