import express from "express";
import {
  getCurrentUser,
  handleLogin,
  handleLogout,
  handleRegister,
  handleUsers,
  handleUsersRoleAssign,
  handleUsersTeamAssign,
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", handleRegister); // registration route
router.post("/login", handleLogin); // login route
router.post("/logout", handleLogout); // logout route
router.get("/me", getCurrentUser); // current user route
router.get("/", handleUsers); // get all users route
router.patch("/:userId/team", handleUsersTeamAssign); // team assignment route
router.patch("/:userId/role", handleUsersRoleAssign); // role assignment route

export default router;
