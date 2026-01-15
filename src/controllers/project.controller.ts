import type { Request, Response } from "express";
import { CheckUserAuth, checkUserPermission } from "../lib/auth.js";
import { Role } from "../types/index.js";
export const handleCreateProject = async (req: Request, res: Response) => {
  try{const user = await CheckUserAuth(req);
  if (!user || !checkUserPermission(user, Role.MANAGER)) {
    return res.status(403).send("Unauthorized Access to Create Project");
  }
  // Logic to create a project goes here
  const { name, description } = req.body;
  
}
  catch(error){
    res.status(500).send("Internal Server Error");
  }
};
