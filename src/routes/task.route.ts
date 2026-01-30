import express from "express";
import { handleCreateTask } from "../controllers/task.controller.js";

const router = express.Router();

// Defining task-related routes here
router.post("/create", handleCreateTask); //create task

export default router;
