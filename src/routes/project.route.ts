import express from "express";
import { handleCreateProject } from "../controllers/project.controller.js";

const router = express.Router();

// Defining project-related routes here
router.post("/create", handleCreateProject); //create project
export default router;
