import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role, type User } from "../types/index.js";
import { prisma } from "./db.js";
import type { Request } from "express";

export const hashedPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as {
    userId: string;
  };
};

export const checkUserPermission = (
  user: User,
  requiredRole: Role
): boolean => {
  const roleHierarchy = {
    [Role.GUEST]: 0,
    [Role.USER]: 1,
    [Role.MANAGER]: 2,
    [Role.ADMIN]: 3,
  };
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
};

export const MAX_ADMINS = 3;

export const CheckUserAuth = async (req: Request): Promise<User | null> => {
  try {
    const token = await req.cookies["access_token"];
    if (!token) return null;
    const decode = verifyToken(token);
    const userFromDb = await prisma.user.findUnique({
      where: { id: decode.userId },
    });
    if (!userFromDb) return null;
    const { password, ...user } = userFromDb;
    return user as User;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
};
