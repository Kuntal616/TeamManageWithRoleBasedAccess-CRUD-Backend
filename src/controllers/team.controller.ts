import type { Request, Response } from "express";
import { CheckUserAuth, checkUserPermission } from "../lib/auth.js";
import { Role } from "../types/index.js";
import { prisma } from "../lib/db.js";
import type { Prisma } from "../generated/prisma/client.js";
import e from "express";

// Handler to create a new team
export const handleTeamCreate = async (req: Request, res: Response) => {
  try {
    const user = await CheckUserAuth(req);
    if (!user || !checkUserPermission(user, Role.ADMIN)) {
      return res
        .status(403)
        .json({ error: "Forbidden only admins can create teams" });
    }
    const { name, description, code } = req.body;
    // Here you would typically add logic to save the team to your database
    // Trim & normalize
    const teamName = name.trim();
    const teamCode = code.trim().toUpperCase();
    if (!teamName || !teamCode) {
      return res.status(400).json({ error: "Name and code are required" });
    }
    // duplicate team name or code check would go here
    const existTeam = await prisma.team.findFirst({
      where: {
        OR: [{ name: teamName }, { code: teamCode }],
      },
    });
    if (existTeam) {
      return res
        .status(409)
        .json({ error: "Team with the same name or code already exists" });
    }
    // Create team
    const newTeam = await prisma.team.create({
      data: {
        name: teamName,
        description: description || null,
        code: teamCode,
      },
    });
    return res
      .status(201)
      .json({ team: newTeam, message: "Team created successfully" });
  } catch (error) {
    console.error("Error creating team:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// Handler to update an existing team
export const handleTeamUpdate = async (req: Request, res: Response) => {
  try {
    const user = await CheckUserAuth(req);
    if (!user || !checkUserPermission(user, Role.ADMIN)) {
      return res
        .status(403)
        .json({ error: "Forbidden only admins can update teams" });
    }
    const { teamId } = req.params;
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }
    const { name, description, code } = req.body;
    if (!name && !description && !code) {
      return res.status(400).json({
        error:
          "At least one field (name, description, code) must be provided for update",
      });
    }
    const existing = await prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Team not found" });
    }
    // Normalise input
    const newName = name?.trim();
    const newCode = code?.trim().toUpperCase();
    if (newName === "") {
      return res.status(400).json({ error: "Name cannot be empty" });
    }
    if (newCode === "") {
      return res.status(400).json({ error: "Code cannot be empty" });
    }
    const orFilters: Prisma.TeamWhereInput[] = [];

    if (newName) orFilters.push({ name: newName });
    if (newCode) orFilters.push({ code: newCode });

    let duplicate = null;

    if (orFilters.length > 0) {
      duplicate = await prisma.team.findFirst({
        where: {
          AND: [{ id: { not: teamId } }, { OR: orFilters }],
        },
      });
    }
    if (duplicate) {
      return res
        .status(409)
        .json({ error: "Team with the same name or code already exists" });
    }
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: newName || existing.name,
        description:
          description !== undefined ? description : existing.description,
        code: newCode || existing.code,
      },
    });
    return res
      .status(200)
      .json({ team: updatedTeam, message: "Team updated successfully" });
  } catch (error) {
    console.error("Error updating team:", error);
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found.")
    ) {
      return res.status(404).json({ error: "Team not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Handler to delete an existing team
export const handleTeamDelete = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const user = await CheckUserAuth(req);
    if (!user || !checkUserPermission(user, Role.ADMIN)) {
      return res
        .status(403)
        .json({ error: "Forbidden only admins can delete teams" });
    }
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }
    const existing = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!existing) {
      return res.status(404).json({ error: "Team not found" });
    }
    await prisma.team.delete({
      where: { id: teamId },
    });
    //because of onDelete SetNull all users teamid = null of this team
    return res.status(200).json({
      teamId,
      members: existing.members,
      message: "Team Deleted Successfully",
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found.")
    ) {
      return res.status(404).json({ error: "Team not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const handleTeamList = async (req: Request, res: Response) => {
  try {
    const user = await CheckUserAuth(req);
    if (!user || !checkUserPermission(user, Role.ADMIN)) {
      return res
        .status(403)
        .json({ error: "Forbidden only admins can list teams" });
    }
    const search = (req.query.search as string)?.trim();
    const filter: Prisma.TeamWhereInput = {};
    if (search) {
      filter.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    const teams = await prisma.team.findMany({
      where: search ? filter : {},
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({
      teams,
      message: "Teams retrieved successfully",
    });
  } catch (error) {
    console.error("Error listing teams:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const handleTeamMembers = async (req: Request, res: Response) => {
  try {
    const user = await CheckUserAuth(req);
    const { teamId } = req.params;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }
    if (checkUserPermission(user, Role.ADMIN)) {
    } else if (
      checkUserPermission(user, Role.MANAGER) ||
      checkUserPermission(user, Role.USER)
    ) {
      if (!user.teamId || user.teamId !== teamId) {
        return res.status(403).json({
          error: "Forbidden you can only access your own team members",
        });
      }
    }
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    const members = await prisma.user.findMany({
      where: { teamId: teamId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    });
    return res.status(200).json({
      team,
      members,
      message: "Team members retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving team members:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
