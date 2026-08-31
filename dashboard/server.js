require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const express = require("express");
const path = require("path");
const db = require("../utils/database");

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3001;

app.use(express.json());
app.use(express.static(__dirname));

// ---- Simple auth middleware (token in header) ----
const ADMIN_TOKEN = process.env.DASHBOARD_TOKEN || "changeme";

function auth(req, res, next) {
  const token = req.headers["x-dashboard-token"];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized - token invalid" });
  }
  next();
}

// ---- Public status endpoint ----
app.get("/api/status", (req, res) => {
  const data = db.readDB();
  res.json({
    online: true,
    uptime: process.uptime(),
    guilds: Object.keys(data.guilds).length,
    trackedUsers: Object.keys(data.users).length,
    giveaways: Object.keys(data.giveaways).length,
  });
});

// ---- Guilds list ----
app.get("/api/guilds", auth, (req, res) => {
  const data = db.readDB();
  const guilds = Object.entries(data.guilds).map(([id, cfg]) => ({
    id,
    name: cfg.name || id,
    memberCount: cfg.memberCount || null,
    welcome: !!cfg.welcome,
    serverIp: cfg.serverIp,
    serverVersion: cfg.serverVersion,
    logsChannelId: cfg.logsChannelId,
    autoRoleId: cfg.autoRoleId,
  }));
  res.json(guilds);
});

// ---- Guild details + config update ----
app.get("/api/guilds/:id", auth, (req, res) => {
  const cfg = db.getGuildConfig(req.params.id);
  res.json({ id: req.params.id, config: cfg });
});

app.post("/api/guilds/:id/config", auth, (req, res) => {
  const { key, value } = req.body;
  const allowed = [
    "welcome",
    "hMessage",
    "hClaimRole",
    "ticketCategory",
    "ticketMessage",
    "serverIp",
    "serverVersion",
    "veteranRoleId",
    "afkVoiceChannelId",
    "autoRoleId",
    "logsChannelId",
    "lockdownRoleId",
    "levelingChannelId",
  ];
  if (!allowed.includes(key)) {
    return res
      .status(400)
      .json({ error: `Key not editable. Allowed: ${allowed.join(", ")}` });
  }
  const cfg = db.updateGuildConfig(req.params.id, key, value);
  res.json({ success: true, config: cfg });
});

// ---- Leaderboard (top users by XP) ----
app.get("/api/leaderboard/:guildId", auth, (req, res) => {
  const data = db.readDB();
  const prefix = req.params.guildId + "_";
  const users = Object.entries(data.users)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, v]) => ({ userId: k.split("_")[1], ...v }))
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 25);
  res.json(users);
});

// ---- Adjust XP (admin action) ----
app.post("/api/xp/:guildId/:userId", auth, (req, res) => {
  const { amount } = req.body;
  if (typeof amount !== "number")
    return res.status(400).json({ error: "amount must be a number" });
  let profile;
  if (amount >= 0) {
    profile = db.addXP(req.params.guildId, req.params.userId, amount);
  } else {
    profile = db.deductXP(
      req.params.guildId,
      req.params.userId,
      Math.abs(amount),
    );
  }
  res.json({ success: true, profile });
});

app.listen(PORT, () => {
  console.log(`[Dashboard] Running on http://localhost:${PORT}`);
});
