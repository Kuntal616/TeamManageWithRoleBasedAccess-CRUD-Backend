import express from "express";
import {
  getCurrentUser,
  handleUserRemoveFromTeam,
  handleUsers,
  handleUsersRoleAssign,
  handleUsersTeamAssign,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", getCurrentUser); // current user route
router.get("/", handleUsers); // get all users route
router.patch("/:userId/team", handleUsersTeamAssign); // team assignment route
router.patch("/:userId/role", handleUsersRoleAssign); // role assignment route
router.delete("/:userId/team", handleUserRemoveFromTeam); //user removed from team route
export default router;
