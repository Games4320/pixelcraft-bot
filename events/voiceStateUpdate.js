const { addVoiceTime } = require('../utils/database');

const activeVoiceSessions = new Map();

/**
 * Get active voice session duration if user is currently connected to voice
 */
function getActiveVoiceDuration(guildId, userId) {
    const key = `${guildId}_${userId}`;
    const start = activeVoiceSessions.get(key);
    if (!start) return 0;
    return Date.now() - start;
}

module.exports = {
    name: 'voiceStateUpdate',
    getActiveVoiceDuration,
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
        }
        // 2. User leaves voice
        else if (wasInVoice && !isInVoice) {
            const start = activeVoiceSessions.get(key);
            if (start) {
                const elapsed = Date.now() - start;
                addVoiceTime(guildId, userId, elapsed);
                activeVoiceSessions.delete(key);
            }
        }
        // 3. User switches voice channels (record time up to switch and continue)
        else if (wasInVoice && isInVoice && oldState.channelId !== newState.channelId) {
            const start = activeVoiceSessions.get(key);
            if (start) {
                const elapsed = Date.now() - start;
                addVoiceTime(guildId, userId, elapsed);
            }
            activeVoiceSessions.set(key, Date.now());
        }
    }
};
