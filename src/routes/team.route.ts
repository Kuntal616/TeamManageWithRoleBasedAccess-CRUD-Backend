import express from "express";
import {
  handleTeamCreate,
  handleTeamUpdate,
  handleTeamDelete,
  handleTeamList,
  handleTeamMembers,
} from "../controllers/team.controller.js";

const router = express.Router();

router.post("/create", handleTeamCreate); // team creation route
router.patch("/:teamId", handleTeamUpdate); // team update route
router.delete("/:teamId", handleTeamDelete); // team deletion route
router.get("/", handleTeamList); // team listing route
router.get("/:teamId/members", handleTeamMembers); // team members listing route
export default router;
