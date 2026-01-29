import type { Request, Response } from "express";
import { CheckUserAuth, checkUserPermission } from "../lib/auth.js";
import { Role } from "../types/index.js";
import { prisma } from "../lib/db.js";
export const handleCreateProject = async (req: Request, res: Response) => {
  try {
    const user = await CheckUserAuth(req);
    if (!user || !checkUserPermission(user, Role.MANAGER)) {
      return res
        .status(403)
        .json({ error: "Unauthorized Access to Create Project" });
    }
    // Logic to create a project goes here
    const { name, description, teamCode } = req.body;
    if (!name || typeof name !== "string") {
      return res
        .status(400)
        .json({ error: "Project name is required and must be a string" });
    }
    if (description && typeof description !== "string") {
      return res
        .status(400)
        .json({ error: "Project description must be a string" });
    }
    let team;
    if (user.role === Role.MANAGER) {
      if (!user.teamId) {
        return res
          .status(400)
          .json({ error: "Manager must belong to a team to create a project" });
      }
      team = await prisma.team.findUnique({
        where: { id: user.teamId },
      });
    }
    if (user.role === Role.ADMIN) {
      if (!teamCode) {
        return res.status(400).json({
          error: "Team code is required for adimin to create a project",
        });
      }
      team = await prisma.team.findUnique({
        where: { code: teamCode },
      });
    }
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    const existingProject = await prisma.project.findUnique({
      where: {
        name_teamId: {
          name,
          teamId: team.id,
        },
      },
    });
    if (existingProject) {
      return res
        .status(409)
        .json({ error: "Project with this name already exists in the team" });
    }
    // create project
    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        team: {
          connect: { id: team.id },
        },
        createdBy: { connect: { id: user.id } },
      },
      include: {
        team: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
    return res.status(201).json({
      project: newProject,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).send("Internal Server Error");
  }
};
