import { prisma } from "../lib/db.js";
import type { Request, Response } from "express";

export async function getHealthStatus(req: Request, res: Response) {
  const isConnected = await checkDatabaseConnection();

  if (!isConnected) {
    return res.status(503).json({
      status: "error",
      message: "Database connection failed",
    });
  }

  return res.json({
    status: "ok",
    message: "Service is healthy",
  });
}

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}
