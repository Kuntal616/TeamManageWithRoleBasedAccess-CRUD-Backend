import type { Request, Response } from "express";
import { CheckUserAuth, checkUserPermission } from "../lib/auth.js";
import { ProjectStatus, Role } from "../types/index.js";
import { prisma } from "../lib/db.js";
import type { Prisma } from "../generated/prisma/client.js";
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

// get all projects based on the user role
export const handleGetAllProjects = async (req: Request, res: Response) => {
  try {
    const user = await CheckUserAuth(req);
    if (!user || !checkUserPermission(user, Role.USER)) {
      return res
        .status(403)
        .json({ error: "Unauthorized Access to Get Projects" });
    }
    if (user.role !== Role.ADMIN && !user.teamId) {
      return res
        .status(403)
        .json({ error: "User must belong to a team to view projects" });
    }

    const { status, search } = req.query;

    const where: Prisma.ProjectWhereInput = {};
    if (user.role !== Role.ADMIN) {
      if (user.teamId) {
        where.teamId = user.teamId;
      }
    }
    // filter by status and search query
    if (status) {
      where.status = status as ProjectStatus;
    }
    if (search) {
      where.name = { contains: search as string, mode: "insensitive" };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        _count: {
          select: { tasks: true },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res
      .status(200)
      .json({ projects, message: "Projects fetched successfully" });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).send("Internal Server Error");
  }
};
