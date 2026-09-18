const { SlashCommandBuilder } = require('discord.js');
const { getUserProfile, getXPProgress } = require('../../utils/database');
const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('בדיקת ה-XP והרמה הנוכחית שלך')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('המשתמש שאת דרגתו ברצונך לבדוק')
                .setRequired(false)
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target') || interaction.user;

        if (targetUser.bot) {
            return interaction.reply({ content: '❌ לבוטים אין נקודות XP או רמות!', ephemeral: true });
        }

        const profile = getUserProfile(interaction.guildId, targetUser.id);
        const progress = getXPProgress(profile.xp);

        // Create visual progress bar (10 blocks)
        const totalBlocks = 10;
        const filledBlocks = Math.min(totalBlocks, Math.max(0, Math.round((progress.percent / 100) * totalBlocks)));
        const emptyBlocks = totalBlocks - filledBlocks;
        const progressBar = '🟩'.repeat(filledBlocks) + '⬛'.repeat(emptyBlocks);

        const embed = createEmbed({
            title: `דרגה של ${targetUser.username}`,
            color: COLORS.PRIMARY,
            description:
                `**רמה ${progress.level}** — ${progress.totalXP.toLocaleString()} XP\n` +
                `${progressBar} ${progress.percent}%\n` +
                `עוד ${progress.xpRemainingToNextLevel} XP לרמה ${progress.level + 1}`,
            footerText: `${(profile.messages || 0).toLocaleString()} הודעות`
        });

        await interaction.reply({ embeds: [embed] });
    }
};
