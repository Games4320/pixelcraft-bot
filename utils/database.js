const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Ensure directory and file exist
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        guilds: {},
        users: {}
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

const DEFAULT_H_MESSAGE = "תודה שפנית אלינו! חבר צוות יטפל בבקשתך בהקדם.\n**קטגוריה:** {category}\n**סיבה:** {reason}";

/**
 * Load database from disk
 */
function readDB() {
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        console.error('Error reading database file:', error);
        return { guilds: {}, users: {} };
    }
}

/**
 * Save database to disk
 */
function writeDB(data) {
    try {
        const tempFile = `${DB_FILE}.tmp`;
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
        fs.renameSync(tempFile, DB_FILE);
    } catch (error) {
        console.error('Error writing database file:', error);
    }
}

/**
 * Get settings for a guild
 */
function getGuildConfig(guildId) {
    const db = readDB();
    if (!db.guilds[guildId]) {
        db.guilds[guildId] = {
            welcome: null,
            hMessage: DEFAULT_H_MESSAGE,
            hClaimRole: null, // Role ID allowed to claim !h requests
            xpshop: [],
            ticketCategory: null,
            ticketMessage: null
        };
        writeDB(db);
    }
    return db.guilds[guildId];
}

/**
 * Update guild configuration
 */
function updateGuildConfig(guildId, key, value) {
    const db = readDB();
    if (!db.guilds[guildId]) {
        db.guilds[guildId] = {
            welcome: null,
            hMessage: DEFAULT_H_MESSAGE,
            hClaimRole: null,
            xpshop: [],
            ticketCategory: null,
            ticketMessage: null
        };
    }
    db.guilds[guildId][key] = value;
    writeDB(db);
    return db.guilds[guildId];
}

/**
 * Get user profile (XP & Level)
 */
function getUserProfile(guildId, userId) {
    const db = readDB();
    const key = `${guildId}_${userId}`;
    if (!db.users[key]) {
        db.users[key] = {
            xp: 0,
            level: 0
        };
        writeDB(db);
    }
    return db.users[key];
}

/**
 * Add XP to user
 */
function addXP(guildId, userId, xpToAdd = 5) {
    const db = readDB();
    const key = `${guildId}_${userId}`;
    if (!db.users[key]) {
        db.users[key] = { xp: 0, level: 0 };
    }
    const current = db.users[key];
    const oldLevel = current.level || Math.floor(current.xp / 150);

    current.xp += xpToAdd;
    const newLevel = Math.floor(current.xp / 150);
    current.level = newLevel;

    const leveledUp = newLevel > oldLevel;
    writeDB(db);

    return {
        xp: current.xp,
        level: current.level,
        leveledUp,
        oldLevel,
        newLevel
    };
}

/**
 * Deduct XP from user
 */
function deductXP(guildId, userId, amount) {
    const db = readDB();
    const key = `${guildId}_${userId}`;
    if (!db.users[key]) {
        db.users[key] = { xp: 0, level: 0 };
    }
    db.users[key].xp = Math.max(0, db.users[key].xp - amount);
    db.users[key].level = Math.floor(db.users[key].xp / 150);
    writeDB(db);
    return db.users[key];
}

module.exports = {
    readDB,
    writeDB,
    getGuildConfig,
    updateGuildConfig,
    getUserProfile,
    addXP,
    deductXP
};
