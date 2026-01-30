import type { Request, Response } from "express";
import { CheckUserAuth, checkUserPermission } from "../lib/auth.js";
import { Role } from "../types/index.js";
import { prisma } from "../lib/db.js";

export const handleCreateTask = async (req: Request, res: Response) => {
  try {
    const user = await CheckUserAuth(req);
    if (!user || !checkUserPermission(user, Role.MANAGER)) {
      return res
        .status(403)
        .json({ error: "Unauthorized Access to Create Task" });
    }

    const { title, description, projectId, assigneeId } = req.body;
    if (!title || typeof title !== "string") {
      return res
        .status(400)
        .json({ error: "Task title is required and must be a string" });
    }
    if (description && typeof description !== "string") {
      return res
        .status(400)
        .json({ error: "Task description must be a string" });
    }
    if (!projectId || typeof projectId !== "string") {
      return res
        .status(400)
        .json({ error: "Project ID is required and must be a string" });
    }
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return res.status(404).json({ error: " Project not found" });
    }
    if (user.role === Role.MANAGER && user.teamId !== project.teamId) {
      return res.status(403).json({
        error: "Managers can only create tasks in their own team projects",
      });
    }
    let assignee = null;
    if (assigneeId && typeof assigneeId !== "string") {
      return res.status(400).json({
        error: "Assignee ID must be a string",
      });
    }
    // manager cannot assign task to themselves
    // now this feature will be handle in fututre
    
    // if (assigneeId === user.id && user.role === Role.MANAGER) {
    //   return res.status(400).json({
    //     error: "Managers cannot assign tasks to themselves",
    //   });
    // }

    if (assigneeId) {
      assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
      });
      if (!assignee) {
        return res.status(404).json({ error: " Assignee user not found" });
      }
      if (assignee.role !== Role.ADMIN) {
        if (!assignee.teamId || assignee.teamId !== project.teamId) {
          return res.status(403).json({
            error: "Assignee must belong to the project team",
          });
        }
      }
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        projectId: project.id,
        assigneeId: assignee ? assignee.id : null,
        createdById: user.id,
      },
    });
    return res
      .status(201)
      .json({ message: "Task created successfully", task: newTask });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).send("Internal Server Error");
  }
};
