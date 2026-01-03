import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import useHealthRoute from "./routes/health.route.js";
import userRoute from "./routes/user.route.js";
import teamRoute from "./routes/team.route.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.use("/api/health", useHealthRoute);
app.use("/api/user", userRoute);
app.use("/api/team", teamRoute);
app.use("/api/teams", (req, res, next) => {
  req.url = req.url === "/" ? "/" : req.url;
  req.baseUrl = "/api/team";
  teamRoute(req, res, next);
});

app.get("/", (_, res) => {
  res.send("Hello, World!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
