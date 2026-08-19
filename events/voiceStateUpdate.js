const { addVoiceTime, addXP, getGuildConfig } = require('../utils/database');
const { createEmbed, COLORS } = require('../utils/embedBuilder');
const { logVoiceState } = require('../utils/logger');

const activeVoiceSessions = new Map();
let voiceXPIntervalStarted = false;

/**
 * Get active voice session duration if user is currently connected to voice
 */
function getActiveVoiceDuration(guildId, userId) {
    const key = `${guildId}_${userId}`;
    const start = activeVoiceSessions.get(key);
    if (!start) return 0;
    return Date.now() - start;
}

/**
 * Initialize 1-minute interval loop for awarding 3 XP per minute in voice channels
 */
function initVoiceXPLoop(client) {
    if (voiceXPIntervalStarted) return;
    voiceXPIntervalStarted = true;

    // Run every 60 seconds (1 minute)
    setInterval(async () => {
        try {
            for (const guild of client.guilds.cache.values()) {
                const config = getGuildConfig(guild.id);
                const afkChannelId = config.afkVoiceChannelId || guild.afkChannelId;

                // Find all active voice channels in this guild
                for (const channel of guild.channels.cache.values()) {
                    if (!channel.isVoiceBased()) continue;

                    // Skip AFK channel
                    if (channel.id === afkChannelId) continue;

                    // Check members in this voice channel
                    const activeMembers = channel.members.filter(m => !m.user.bot);
                    if (activeMembers.size === 0) continue;

                    for (const member of activeMembers.values()) {
                        // Skip deafened members (self deaf or server deaf)
                        if (member.voice.selfDeaf || member.voice.serverDeaf) continue;

                        // Award 3 XP per minute in voice
                        const xpResult = addXP(guild.id, member.id, 3);
                        addVoiceTime(guild.id, member.id, 60 * 1000);

                        // If leveled up from voice XP
                        if (xpResult.leveledUp) {
                            const nextLevelXP = (xpResult.newLevel + 1) * 150;
                            const levelEmbed = createEmbed({
                                title: '🎉 עלית רמה בשיחה קולית!',
                                description: `כל הכבוד ${member}! עלית מ**רמה ${xpResult.oldLevel}** ל**רמה ${xpResult.newLevel}**! 🎙️⭐\n\n` +
                                             `✨ **סה"כ XP מצטבר:** **${xpResult.xp.toLocaleString()} XP** *(נשמר לתמיד ולא מתאפס!)*\n` +
                                             `🎯 **הרמה הבאה (רמה ${xpResult.newLevel + 1}):** ב-**${nextLevelXP.toLocaleString()} XP**`,
                                color: COLORS.SUCCESS,
                                thumbnail: member.user.displayAvatarURL({ dynamic: true }),
                                footerText: `${guild.name} • מערכת רמות קוליות`
                            });

                            // Try to find channel to announce level up
                            const announceChannel = guild.systemChannel ||
                                guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me)?.has('SendMessages'));
                            if (announceChannel) {
                                await announceChannel.send({ embeds: [levelEmbed] }).catch(() => {});
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error in Voice XP loop:', err);
        }
    }, 60 * 1000);

    console.log('[Voice XP] Voice XP system initialized (3 XP/minute, AFK excluded).');
}

module.exports = {
    name: 'voiceStateUpdate',
    getActiveVoiceDuration,
    initVoiceXPLoop,
    async execute(oldState, newState) {
        const member = newState.member || oldState.member;
        if (!member || member.user.bot) return;

        const guildId = (newState.guild || oldState.guild).id;
        const userId = member.id;
        const key = `${guildId}_${userId}`;

        const wasInVoice = !!oldState.channelId;
        const isInVoice = !!newState.channelId;

        // 1. User joins voice
        if (!wasInVoice && isInVoice) {
            activeVoiceSessions.set(key, Date.now());
            const channelName = newState.channel?.name || 'ערוץ קולי';
            await logVoiceState(member.guild, member, 'join', channelName).catch(() => {});
        }
        // 2. User leaves voice
        else if (wasInVoice && !isInVoice) {
            const start = activeVoiceSessions.get(key);
            if (start) {
                const elapsed = Date.now() - start;
                addVoiceTime(guildId, userId, elapsed);
                activeVoiceSessions.delete(key);
            }
            const channelName = oldState.channel?.name || 'ערוץ קולי';
            await logVoiceState(member.guild, member, 'leave', channelName).catch(() => {});
        }
        // 3. User switches voice channels (record time up to switch and continue)
        else if (wasInVoice && isInVoice && oldState.channelId !== newState.channelId) {
            const start = activeVoiceSessions.get(key);
            if (start) {
                const elapsed = Date.now() - start;
                addVoiceTime(guildId, userId, elapsed);
            }
            activeVoiceSessions.set(key, Date.now());
            const channelName = newState.channel?.name || 'ערוץ קולי';
            await logVoiceState(member.guild, member, 'switch', channelName).catch(() => {});
        }
    }
};
