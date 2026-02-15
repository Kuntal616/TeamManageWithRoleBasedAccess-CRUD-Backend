import express from "express";
import {
  handleCreateProject,
  handleGetAllProjects,
} from "../controllers/project.controller.js";

const router = express.Router();

// Defining project-related routes here
router.post("/create", handleCreateProject); //create project
router.get("/", handleGetAllProjects);
export default router;
