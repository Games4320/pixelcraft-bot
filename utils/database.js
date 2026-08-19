const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Ensure directory and file exist
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const DEFAULT_H_MESSAGE = "תודה שפנית אלינו! חבר צוות יטפל בבקשתך בהקדם.\n**קטגוריה:** {category}\n**סיבה:** {reason}";

// In-memory Database Cache for rock-solid consistency across channels and events
let dbCache = null;

/**
 * Load database from disk or return in-memory cache
 */
function readDB() {
    if (dbCache) return dbCache;

    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            dbCache = JSON.parse(raw);
        } else {
            dbCache = { guilds: {}, users: {}, giveaways: {} };
            fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf8');
        }
    } catch (error) {
        console.error('Error reading database file:', error);
        dbCache = { guilds: {}, users: {}, giveaways: {} };
    }

    if (!dbCache.guilds) dbCache.guilds = {};
    if (!dbCache.users) dbCache.users = {};
    if (!dbCache.giveaways) dbCache.giveaways = {};

    return dbCache;
}

/**
 * Save database to disk directly and safely
 */
function writeDB(data) {
    if (data) dbCache = data;
    const toSave = dbCache || readDB();

    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf8');
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
            ticketMessage: null,
            serverIp: null,
            serverVersion: null
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
            ticketMessage: null,
            serverIp: null,
            serverVersion: null
        };
    }
    db.guilds[guildId][key] = value;
    writeDB(db);
    return db.guilds[guildId];
}

/**
 * Get user profile (XP, Level, Messages, Voice Time)
 */
function getUserProfile(guildId, userId) {
    const db = readDB();
    const key = `${guildId}_${userId}`;
    if (!db.users[key]) {
        db.users[key] = {
            xp: 0,
            level: 0,
            messages: 0,
            voiceTimeMs: 0
        };
        writeDB(db);
    }
    const profile = db.users[key];
    if (typeof profile.messages !== 'number') profile.messages = 0;
    if (typeof profile.voiceTimeMs !== 'number') profile.voiceTimeMs = 0;
    return profile;
}

/**
 * Increment user messages count
 */
function incrementMessageCount(guildId, userId) {
    const db = readDB();
    const key = `${guildId}_${userId}`;
    if (!db.users[key]) {
        db.users[key] = { xp: 0, level: 0, messages: 0, voiceTimeMs: 0 };
    }
    db.users[key].messages = (db.users[key].messages || 0) + 1;
    writeDB(db);
    return db.users[key].messages;
}

/**
 * Add voice duration in ms to user
 */
function addVoiceTime(guildId, userId, ms) {
    if (!ms || ms <= 0) return;
    const db = readDB();
    const key = `${guildId}_${userId}`;
    if (!db.users[key]) {
        db.users[key] = { xp: 0, level: 0, messages: 0, voiceTimeMs: 0 };
    }
    db.users[key].voiceTimeMs = (db.users[key].voiceTimeMs || 0) + ms;
    writeDB(db);
    return db.users[key].voiceTimeMs;
}

/**
 * Add XP to user with rock-solid level calculation
 */
function addXP(guildId, userId, xpToAdd = 5) {
    const db = readDB();
    const key = `${guildId}_${userId}`;

    if (!db.users[key]) {
        db.users[key] = { xp: 0, level: 0 };
    }

    const current = db.users[key];
    current.xp = (typeof current.xp === 'number' && !isNaN(current.xp)) ? current.xp : 0;

    // Ensure old level is a number
    const oldLevel = (typeof current.level === 'number' && !isNaN(current.level))
        ? current.level
        : Math.floor(current.xp / 150);

    // Add XP and calculate new level
    current.xp += xpToAdd;
    const newLevel = Math.floor(current.xp / 150);
    current.level = newLevel;

    // Trigger level up only when new level strictly exceeds old level
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
    incrementMessageCount,
    addVoiceTime,
    addXP,
    deductXP
};
