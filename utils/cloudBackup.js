/**
 * Cloud Backup - keeps data/database.json safe across Render deploys.
 *
 * How it works:
 *  - On startup: restores the newest copy of the database from a private GitHub Gist
 *    (if the gist copy is newer than the local file).
 *  - Every 10 minutes (and on shutdown): uploads the local database to the gist
 *    if it changed.
 *
 * Required environment variables (set in Render -> Environment):
 *   GITHUB_TOKEN - a GitHub personal access token with "gist" scope
 *   GITHUB_GIST_ID - (optional on first run) the gist id; auto-created if empty
 */
const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "..", "data", "database.json");
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = process.env.GITHUB_GIST_ID;
const FILENAME = "database-backup.json";
const API = "https://api.github.com/gists";

const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "pixelcraft-bot",
  "Content-Type": "application/json",
};

function isEnabled() {
  return !!(GITHUB_TOKEN && GITHUB_TOKEN.length > 20);
}

function readLocal() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    }
  } catch (e) {
    console.error("[CloudBackup] Failed reading local DB:", e.message);
  }
  return null;
}

function writeLocal(data) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("[CloudBackup] Failed writing local DB:", e.message);
    return false;
  }
}

async function gistRequest(method, body) {
  const url = GIST_ID ? `${API}/${GIST_ID}` : API;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * Restore newest database from cloud into local file.
 * Returns true if the local DB was replaced from the cloud.
 */
async function restoreFromCloud() {
  if (!isEnabled()) {
    console.log(
      "[CloudBackup] Disabled - set GITHUB_TOKEN to enable cloud backups.",
    );
    return false;
  }
  try {
    const gist = await gistRequest("GET");
    const file = gist.data && gist.data.files && gist.data.files[FILENAME];
    const cloudContent = file && file.content;
    if (!cloudContent) {
      console.log(
        "[CloudBackup] No backup found in cloud yet - keeping local data.",
      );
      return false;
    }
    const cloud = JSON.parse(cloudContent); // { savedAt, data }
    const local = readLocal();

    const localMtime = fs.existsSync(DB_FILE)
      ? fs.statSync(DB_FILE).mtimeMs
      : 0;
    const cloudTime = new Date(cloud.savedAt || 0).getTime();

    if (local && localMtime >= cloudTime) {
      console.log(
        "[CloudBackup] Local data is up to date - no restore needed.",
      );
      return false;
    }

    if (cloud.data && writeLocal(cloud.data)) {
      console.log(
        `[CloudBackup] ✅ Restored database from cloud (saved at ${cloud.savedAt}).`,
      );
      return true;
    }
  } catch (e) {
    console.error(
      "[CloudBackup] Restore failed (keeping local data):",
      e.message,
    );
  }
  return false;
}

/**
 * Upload the local database to the cloud gist.
 * Auto-creates the gist on first run - copy the logged GIST_ID into your env.
 */
async function saveToCloud() {
  if (!isEnabled()) return false;
  try {
    const local = readLocal();
    if (!local) return false;

    const content = JSON.stringify({
      savedAt: new Date().toISOString(),
      data: local,
    });
    const payload = {
      description: "pixelcraft-bot database backup (automatic)",
      public: false,
      files: { [FILENAME]: { content } },
    };

    if (GIST_ID) {
      await gistRequest("PATCH", payload);
    } else {
      const created = await gistRequest("POST", payload);
      console.log("\n====================================================");
      console.log("[CloudBackup] ✅ Created backup gist!");
      console.log(`[CloudBackup] Add this to your Render env vars:`);
      console.log(`GITHUB_GIST_ID=${created.id}`);
      console.log("====================================================\n");
    }
    console.log("[CloudBackup] ☁️ Database backed up to cloud.");
    return true;
  } catch (e) {
    console.error("[CloudBackup] Backup failed:", e.message);
    return false;
  }
}

/** Start automatic backups every `minutes` minutes */
function startAutoBackup(minutes = 10) {
  if (!isEnabled()) return;
  setInterval(() => saveToCloud(), minutes * 60 * 1000);
  // Also save on shutdown (Render sends SIGTERM before restarts/deploys)
  const onExit = () => {
    saveToCloud();
  };
  process.on("SIGTERM", onExit);
  process.on("SIGINT", onExit);
  console.log(`[CloudBackup] Auto-backup every ${minutes} minutes enabled.`);
}

module.exports = { restoreFromCloud, saveToCloud, startAutoBackup, isEnabled };
