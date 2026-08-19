const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');
const { readDB, writeDB } = require('./database');
const { createEmbed, COLORS } = require('./embedBuilder');

const activeTimeouts = new Map();

/**
 * Parse time string (e.g. 10s, 10m, 2h, 1d) into milliseconds
 */
function parseDuration(str) {
    if (!str) return null;
    let totalMs = 0;
    const regex = /(\d+)\s*(s|sec|seconds?|m|min|minutes?|h|hr|hours?|d|days?|w|weeks?)/gi;
    let match;
    let matchedAny = false;

    while ((match = regex.exec(str)) !== null) {
        matchedAny = true;
        const val = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();

        if (unit.startsWith('s')) totalMs += val * 1000;
        else if (unit.startsWith('m')) totalMs += val * 60 * 1000;
        else if (unit.startsWith('h')) totalMs += val * 60 * 60 * 1000;
        else if (unit.startsWith('d')) totalMs += val * 24 * 60 * 60 * 1000;
        else if (unit.startsWith('w')) totalMs += val * 7 * 24 * 60 * 60 * 1000;
    }

    if (!matchedAny && /^\d+$/.test(str.trim())) {
        return parseInt(str.trim(), 10) * 60 * 1000;
    }

    return matchedAny && totalMs > 0 ? totalMs : null;
}

/**
 * Get all giveaways from database
 */
function getGiveawaysDB() {
    const db = readDB();
    if (!db.giveaways) {
        db.giveaways = {};
        writeDB(db);
    }
    return db.giveaways;
}

/**
 * Save giveaway to database
 */
function saveGiveaway(data) {
    const db = readDB();
    if (!db.giveaways) db.giveaways = {};
    db.giveaways[data.messageId] = data;
    writeDB(db);
}

/**
 * Start a new giveaway
 */
async function startGiveaway(client, interaction, { timeStr, winnerCount, prize }) {
    const durationMs = parseDuration(timeStr);
    if (!durationMs || durationMs < 5000) {
        return interaction.reply({
            content: '❌ זמן לא תקין! אנא ציין זמן תקין (לדוגמה: `10s`, `10m`, `2h`, `1d`). מינימום 5 שניות.',
            ephemeral: true
        });
    }

    if (!winnerCount || winnerCount < 1) {
        return interaction.reply({
            content: '❌ מספר הזוכים חייב להיות לפחות 1.',
            ephemeral: true
        });
    }

    const endsAt = Date.now() + durationMs;
    const endTimestamp = Math.floor(endsAt / 1000);

    const embed = createEmbed({
        title: `🎉 הגרלה: ${prize}`,
        description: `לחץ על הכפתור למטה כדי להצטרף להגרלה!\n\n` +
                     `🎁 **פרס:** ${prize}\n` +
                     `👥 **מספר זוכים:** ${winnerCount}\n` +
                     `⏳ **מסתיים בעוד:** <t:${endTimestamp}:R> (<t:${endTimestamp}:F>)\n` +
                     `👑 **יוצר ההגרלה:** ${interaction.user}`,
        color: COLORS.PRIMARY,
        footerText: `${interaction.guild.name} • 0 משתתפים`
    });

    const joinBtn = new ButtonBuilder()
        .setCustomId('giveaway_join_btn')
        .setLabel('🎉 הצטרף להגרלה (0)')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(joinBtn);

    const message = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true
    });

    const giveawayData = {
        messageId: message.id,
        channelId: interaction.channelId,
        guildId: interaction.guildId,
        hostId: interaction.user.id,
        prize,
        winnerCount,
        endsAt,
        participants: [],
        ended: false,
        winners: []
    };

    saveGiveaway(giveawayData);

    // Schedule giveaway end
    const timeout = setTimeout(() => {
        endGiveaway(client, message.id);
    }, durationMs);

    activeTimeouts.set(message.id, timeout);
}

/**
 * Handle user joining / leaving giveaway via button
 */
async function handleGiveawayButton(interaction) {
    const messageId = interaction.message.id;
    const db = readDB();
    const giveaways = db.giveaways || {};
    const giveaway = giveaways[messageId];

    if (!giveaway) {
        return interaction.reply({ content: '❌ הגרלה זו אינה קיימת במאגר הנתונים.', ephemeral: true });
    }

    if (giveaway.ended || Date.now() >= giveaway.endsAt) {
        return interaction.reply({ content: '❌ ההגרלה הזו כבר הסתיימה!', ephemeral: true });
    }

    const userId = interaction.user.id;
    const isEntered = giveaway.participants.includes(userId);

    if (isEntered) {
        // Leave
        giveaway.participants = giveaway.participants.filter(id => id !== userId);
        saveGiveaway(giveaway);

        await updateGiveawayMessage(interaction.guild, giveaway);
        return interaction.reply({
            content: `❌ הסרת את השתתפותך מההגרלה על **${giveaway.prize}**.`,
            ephemeral: true
        });
    } else {
        // Join
        giveaway.participants.push(userId);
        saveGiveaway(giveaway);

        await updateGiveawayMessage(interaction.guild, giveaway);
        return interaction.reply({
            content: `✅ הצטרפת להגרלה על **${giveaway.prize}** בהצלחה! 🍀`,
            ephemeral: true
        });
    }
}

/**
 * Update the giveaway message participant count
 */
async function updateGiveawayMessage(guild, giveaway) {
    try {
        const channel = guild.channels.cache.get(giveaway.channelId) || await guild.channels.fetch(giveaway.channelId).catch(() => null);
        if (!channel) return;

        const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
        if (!message) return;

        const count = giveaway.participants.length;
        const endTimestamp = Math.floor(giveaway.endsAt / 1000);

        const embed = createEmbed({
            title: `🎉 הגרלה: ${giveaway.prize}`,
            description: `לחץ על הכפתור למטה כדי להצטרף להגרלה!\n\n` +
                         `🎁 **פרס:** ${giveaway.prize}\n` +
                         `👥 **מספר זוכים:** ${giveaway.winnerCount}\n` +
                         `⏳ **מסתיים בעוד:** <t:${endTimestamp}:R> (<t:${endTimestamp}:F>)\n` +
                         `👑 **יוצר ההגרלה:** <@${giveaway.hostId}>`,
            color: COLORS.PRIMARY,
            footerText: `${guild.name} • ${count} ${count === 1 ? 'משתתף' : 'משתתפים'}`
        });

        const joinBtn = new ButtonBuilder()
            .setCustomId('giveaway_join_btn')
            .setLabel(`🎉 הצטרף להגרלה (${count})`)
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(joinBtn);

        await message.edit({ embeds: [embed], components: [row] });
    } catch (err) {
        console.error('Error updating giveaway message:', err);
    }
}

/**
 * End a giveaway and pick winners
 */
async function endGiveaway(client, messageId) {
    const db = readDB();
    const giveaways = db.giveaways || {};
    const giveaway = giveaways[messageId];
    if (!giveaway || giveaway.ended) return;

    giveaway.ended = true;

    if (activeTimeouts.has(messageId)) {
        clearTimeout(activeTimeouts.get(messageId));
        activeTimeouts.delete(messageId);
    }

    try {
        const guild = client.guilds.cache.get(giveaway.guildId) || await client.guilds.fetch(giveaway.guildId).catch(() => null);
        if (!guild) {
            saveGiveaway(giveaway);
            return;
        }

        const channel = guild.channels.cache.get(giveaway.channelId) || await guild.channels.fetch(giveaway.channelId).catch(() => null);
        if (!channel) {
            saveGiveaway(giveaway);
            return;
        }

        const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);

        const participants = giveaway.participants || [];
        const winnerCount = Math.min(giveaway.winnerCount, participants.length);

        let winners = [];
        if (participants.length > 0) {
            // Shuffle and pick random winners
            const shuffled = [...participants].sort(() => 0.5 - Math.random());
            winners = shuffled.slice(0, winnerCount);
        }

        giveaway.winners = winners;
        saveGiveaway(giveaway);

        const winnersText = winners.length > 0
            ? winners.map(id => `<@${id}>`).join(', ')
            : 'אין מספיק משתתפים';

        const embed = createEmbed({
            title: `🎉 ההגרלה הסתיימה! - ${giveaway.prize}`,
            description: `🎁 **פרס:** ${giveaway.prize}\n` +
                         `👑 **יוצר ההגרלה:** <@${giveaway.hostId}>\n` +
                         `🏆 **זוכים:** ${winnersText}\n` +
                         `👥 **סה"כ משתתפים:** ${participants.length}`,
            color: winners.length > 0 ? COLORS.SUCCESS : COLORS.ERROR,
            footerText: `${guild.name} • ההגרלה הסתיימה`
        });

        const disabledBtn = new ButtonBuilder()
            .setCustomId('giveaway_ended_btn')
            .setLabel(`ההגרלה הסתיימה (${participants.length} משתתפים)`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const row = new ActionRowBuilder().addComponents(disabledBtn);

        if (message) {
            await message.edit({ embeds: [embed], components: [row] }).catch(() => {});
        }

        if (winners.length > 0) {
            await channel.send({
                content: `🎊 **מזל טוב!** ${winnersText} זכיתם ב: **${giveaway.prize}**! 🎁\n${message ? `קישור להגרלה: ${message.url}` : ''}`,
                allowedMentions: { parse: ['users'] }
            });
        } else {
            await channel.send({
                content: `⚠️ ההגרלה על **${giveaway.prize}** הסתיימה, אך לא היו מספיק משתתפים כדי לבחור זוכה.`
            });
        }
    } catch (err) {
        console.error('Error ending giveaway:', err);
    }
}

/**
 * Reroll winners for an ended giveaway
 */
async function rerollGiveaway(interaction, messageId) {
    const db = readDB();
    const giveaways = db.giveaways || {};
    const giveaway = giveaways[messageId];

    if (!giveaway) {
        return interaction.reply({
            content: `❌ לא נמצאה הגרלה עם מזהה הודעה: \`${messageId}\`. וודא שה-ID תקין.`,
            ephemeral: true
        });
    }

    if (!giveaway.ended) {
        return interaction.reply({
            content: '❌ הגרלה זו עדיין פעילה! ניתן להגריל מחדש רק לאחר שההגרלה הסתיימה.',
            ephemeral: true
        });
    }

    const participants = giveaway.participants || [];
    if (participants.length === 0) {
        return interaction.reply({
            content: '❌ אין משתתפים בהגרלה זו, לא ניתן להגריל מחדש.',
            ephemeral: true
        });
    }

    // Pick random winner from participants
    const randomWinnerId = participants[Math.floor(Math.random() * participants.length)];

    await interaction.reply({
        content: `🎉 **הגרלה חוזרת (Reroll)!**\n` +
                 `הזוכה החדש ב-**${giveaway.prize}** הוא: <@${randomWinnerId}>! 🎊`,
        allowedMentions: { parse: ['users'] }
    });
}

/**
 * Initialize and resume active giveaways across bot restarts
 */
async function initGiveaways(client) {
    const db = readDB();
    const giveaways = db.giveaways || {};
    const now = Date.now();

    for (const [messageId, g] of Object.entries(giveaways)) {
        if (!g.ended) {
            if (g.endsAt <= now) {
                // Should have ended while offline
                endGiveaway(client, messageId);
            } else {
                const remaining = g.endsAt - now;
                const timeout = setTimeout(() => {
                    endGiveaway(client, messageId);
                }, remaining);
                activeTimeouts.set(messageId, timeout);
                console.log(`[Giveaways] Resumed active giveaway (${g.prize}) ending in ${Math.round(remaining / 1000)}s`);
            }
        }
    }
}

module.exports = {
    parseDuration,
    startGiveaway,
    handleGiveawayButton,
    endGiveaway,
    rerollGiveaway,
    initGiveaways
};
