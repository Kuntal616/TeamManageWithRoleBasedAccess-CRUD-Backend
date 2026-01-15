import express from "express";
import { handleCreateProject } from "../controllers/project.controller.js";

const router = express.Router();

// Define your project-related routes here
//create project
router.post("/create", handleCreateProject);
export default router;
