const { PermissionsBitField } = require('discord.js');
const { getGuildConfig } = require('./database');
const { logAutoMod } = require('./logger');

// Spam tracking maps: userId -> timestamps array
const userMessageTimestamps = new Map();
// Repeated content tracking: userId -> { content, count, lastTime }
const userLastMessage = new Map();

// Bad words list (Hebrew & English common slurs / severe profanities)
const BAD_WORDS = [
    'שרמוטה', 'זונה', 'בן זונה', 'בת זונה', 'קוקסינל', 'מזדיין', 'מזדיינת', 'כוסאמא', 'כוסימא',
    'כוסעמק', 'כוסאמק', 'מניאק', 'הומו מסריח', 'מפגר', 'נאצי', 'היטלר', 'שואה', 'ערבוש',
    'fuck', 'bitch', 'nigger', 'nigga', 'faggot', 'whore', 'slut', 'cunt', 'dick', 'pussy'
];

const INVITE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li|com\/invite)|discordapp\.com\/invite|dsc\.gg)\/+[a-zA-Z0-9_-]+/gi;

/**
 * Checks a message against Auto-Mod rules (Anti-Invite, Anti-Spam, Anti-Curse).
 * Returns { blocked: true, reason: string } if message was deleted.
 */
async function handleAutoMod(message) {
    if (!message.guild || message.author.bot) return { blocked: false };

    // Staff / Admins bypass Auto-Mod
    const isStaff = message.member && (
        message.member.permissions.has(PermissionsBitField.Flags.ManageMessages) ||
        message.member.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
        message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    );

    if (isStaff) return { blocked: false };

    const content = message.content.toLowerCase();
    const now = Date.now();
    const userId = message.author.id;

    // 1. Anti-Invite Filter
    if (INVITE_REGEX.test(message.content)) {
        try {
            await message.delete().catch(() => {});
            const warn = await message.channel.send(`🚫 ${message.author}, **חל איסור לפרסם קישורי הזמנה לשרתי דיסקורד אחרים!**`).catch(() => {});
            if (warn) setTimeout(() => warn.delete().catch(() => {}), 6000);
            await logAutoMod(message.guild, { member: message.member, channel: message.channel, reason: 'invite', content: message.content }).catch(() => {});
            return { blocked: true, reason: 'invite' };
        } catch (err) {}
    }

    // 2. Anti-Curse / Bad Words Filter
    for (const badWord of BAD_WORDS) {
        // Match whole word or exact token
        const regex = new RegExp(`(^|\\s|[.,!?;])${badWord}($|\\s|[.,!?;])`, 'i');
        if (regex.test(content) || content.includes(badWord)) {
            try {
                await message.delete().catch(() => {});
                const warn = await message.channel.send(`⚠️ ${message.author}, **נא לשמור על שפה נקייה ומכבדת בצ'אט!**`).catch(() => {});
                if (warn) setTimeout(() => warn.delete().catch(() => {}), 6000);
                await logAutoMod(message.guild, { member: message.member, channel: message.channel, reason: 'curse', content: message.content }).catch(() => {});
                return { blocked: true, reason: 'curse' };
            } catch (err) {}
        }
    }

    // 3. Anti-Spam Filter (Rate limit: > 5 messages in 4 seconds)
    const timestamps = userMessageTimestamps.get(userId) || [];
    const recent = timestamps.filter(t => now - t < 4000);
    recent.push(now);
    userMessageTimestamps.set(userId, recent);

    if (recent.length > 5) {
        try {
            await message.delete().catch(() => {});
            const warn = await message.channel.send(`⏳ ${message.author}, **נא להפסיק להציף את הצ'אט!**`).catch(() => {});
            if (warn) setTimeout(() => warn.delete().catch(() => {}), 6000);
            await logAutoMod(message.guild, { member: message.member, channel: message.channel, reason: 'spam', content: message.content }).catch(() => {});
            return { blocked: true, reason: 'spam' };
        } catch (err) {}
    }

    // 4. Anti-Duplicate Spam (3 identical messages in 10 seconds)
    const last = userLastMessage.get(userId);
    if (last && last.content === content && now - last.time < 10000) {
        last.count += 1;
        last.time = now;
        if (last.count >= 3) {
            try {
                await message.delete().catch(() => {});
                const warn = await message.channel.send(`⚠️ ${message.author}, **נא לא לשלוח הודעות כפולות שוב ושוב!**`).catch(() => {});
                if (warn) setTimeout(() => warn.delete().catch(() => {}), 6000);
                await logAutoMod(message.guild, { member: message.member, channel: message.channel, reason: 'duplicate_spam', content: message.content }).catch(() => {});
                return { blocked: true, reason: 'duplicate_spam' };
            } catch (err) {}
        }
    } else {
        userLastMessage.set(userId, { content, count: 1, time: now });
    }

    return { blocked: false };
}

module.exports = {
    handleAutoMod
};
