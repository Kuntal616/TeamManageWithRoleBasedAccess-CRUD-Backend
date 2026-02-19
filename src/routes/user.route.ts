import express from "express";
import {
  getCurrentUser,
  handleUserRemoveFromTeam,
  handleUsers,
  handleUsersRoleAssign,
  handleUsersTeamAssign,
  handleAdminResetUserPassword,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", getCurrentUser); // current user route
router.get("/", handleUsers); // get all users route
router.patch("/:userId/team", handleUsersTeamAssign); // team assignment route
router.patch("/:userId/role", handleUsersRoleAssign); // role assignment route
router.delete("/:userId/team", handleUserRemoveFromTeam); //user removed from team route
router.patch("/:userId/reset-password", handleAdminResetUserPassword); // Admin reset user password route
export default router;
