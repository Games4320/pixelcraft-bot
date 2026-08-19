const { getUserProfile } = require('../../utils/database');
const { createEmbed, COLORS } = require('../../utils/embedBuilder');
const { getUserInvitesCount } = require('../../utils/inviteTracker');
const { getActiveVoiceDuration } = require('../../events/voiceStateUpdate');

function formatVoiceDuration(ms) {
    if (!ms || ms < 1000) return '0 דקות';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'שעה' : 'שעות'}`);
    if (minutes > 0 || hours === 0) parts.push(`${minutes} ${minutes === 1 ? 'דקה' : 'דקות'}`);
    return parts.join(', ');
}

module.exports = {
    name: 'status',
    description: 'הצגת סטטוס מפורט על משתמש בשרת',
    async execute(message, args) {
        const targetUser = message.mentions.users.first() || message.author;

        if (targetUser.bot) {
            return message.reply('❌ לא ניתן להציג סטטוס עבור בוטים.');
        }

        const member = message.guild.members.cache.get(targetUser.id) ||
            await message.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return message.reply('❌ המשתמש לא נמצא בשרת זה.');
        }

        // 1. Messages & XP
        const profile = getUserProfile(message.guild.id, targetUser.id);
        const xp = profile.xp || 0;
        const level = profile.level || Math.floor(xp / 150);
        const messagesCount = profile.messages || 0;

        // 2. Voice Duration
        const savedVoiceMs = profile.voiceTimeMs || 0;
        const liveVoiceMs = getActiveVoiceDuration(message.guild.id, targetUser.id);
        const totalVoiceMs = savedVoiceMs + liveVoiceMs;
        const voiceTimeFormatted = formatVoiceDuration(totalVoiceMs);

        // 3. Highest Role
        const highestRole = member.roles.highest;
        const highestRoleText = (highestRole && highestRole.id !== message.guild.id)
            ? `${highestRole}`
            : 'ללא תפקיד';

        // 4. Time in Server
        let timeInServerText = 'לא ידוע';
        if (member.joinedAt) {
            const joinTimestamp = Math.floor(member.joinedTimestamp / 1000);
            const diffDays = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));
            timeInServerText = `<t:${joinTimestamp}:R> (${diffDays} ${diffDays === 1 ? 'יום' : 'ימים'})`;
        }

        // 5. Invites Count
        const invitesCount = await getUserInvitesCount(message.guild, targetUser.id);

        const embed = createEmbed({
            title: `📊 סטטוס משתמש - ${targetUser.username}`,
            thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
            color: COLORS.PRIMARY,
            fields: [
                { name: '💬 הודעות שכתב:', value: `\`${messagesCount}\` הודעות`, inline: true },
                { name: '🎙️ זמן בשיחה:', value: `\`${voiceTimeFormatted}\``, inline: true },
                { name: '✨ XP:', value: `**${xp}** XP (רמה **${level}**)`, inline: true },
                { name: '🛡️ רול הכי גבוה שיש לו:', value: `${highestRoleText}`, inline: true },
                { name: '📅 כמה זמן בשרת:', value: `${timeInServerText}`, inline: true },
                { name: '📩 הזמנות:', value: `\`${invitesCount}\` הזמנות`, inline: true }
            ],
            footerText: `${message.guild.name} • סטטוס משתמש`
        });

        await message.reply({ embeds: [embed] });
    }
};
