import express from "express";
import {
  handleChangePassword,
  handleLogin,
  handleLogout,
  handleRegister,
  handleForgotPassword,
  handleResetPassword,
  handleForceChangePassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", handleRegister); // registration route
router.post("/login", handleLogin); // login route
router.post("/logout", handleLogout); // logout route
router.patch("/change-password", handleChangePassword); // change password route
router.post("/forgot-password", handleForgotPassword); // forgot password route
router.post("/reset-password", handleResetPassword); // reset password route
router.post("/force-change-password", handleForceChangePassword); // force change password route for admin to reset user password

export default router;
