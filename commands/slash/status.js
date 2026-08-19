const { SlashCommandBuilder } = require('discord.js');
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
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('הצגת סטטוס מפורט על משתמש בשרת')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('המשתמש שאת הסטטוס שלו ברצונך לבדוק (אופציונלי)')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;

        if (targetUser.bot) {
            return interaction.reply({ content: '❌ לא ניתן להציג סטטוס עבור בוטים.', ephemeral: true });
        }

        const member = interaction.guild.members.cache.get(targetUser.id) ||
            await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: '❌ המשתמש לא נמצא בשרת זה.', ephemeral: true });
        }

        await interaction.deferReply();

        // 1. Messages & XP
        const profile = getUserProfile(interaction.guildId, targetUser.id);
        const xp = profile.xp || 0;
        const level = profile.level;
        const messagesCount = profile.messages || 0;

        // 2. Voice Duration
        const savedVoiceMs = profile.voiceTimeMs || 0;
        const liveVoiceMs = getActiveVoiceDuration(interaction.guildId, targetUser.id);
        const totalVoiceMs = savedVoiceMs + liveVoiceMs;
        const voiceTimeFormatted = formatVoiceDuration(totalVoiceMs);

        // 3. Highest Role
        const highestRole = member.roles.highest;
        const highestRoleText = (highestRole && highestRole.id !== interaction.guild.id)
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
        const invitesCount = await getUserInvitesCount(interaction.guild, targetUser.id);

        const embed = createEmbed({
            title: `📊 סטטוס משתמש - ${targetUser.username}`,
            thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
            color: COLORS.PRIMARY,
            fields: [
                { name: '💬 הודעות שכתב:', value: `\`${messagesCount}\` הודעות`, inline: true },
                { name: '🎙️ זמן בשיחה:', value: `\`${voiceTimeFormatted}\``, inline: true },
                { name: '✨ XP:', value: `**${xp.toLocaleString()}** XP (רמה **${level}**)`, inline: true },
                { name: '🛡️ רול הכי גבוה שיש לו:', value: `${highestRoleText}`, inline: true },
                { name: '📅 כמה זמן בשרת:', value: `${timeInServerText}`, inline: true },
                { name: '📩 הזמנות:', value: `\`${invitesCount}\` הזמנות`, inline: true }
            ],
            footerText: `${interaction.guild.name} • סטטוס משתמש`
        });

        await interaction.editReply({ embeds: [embed] });
    }
};
