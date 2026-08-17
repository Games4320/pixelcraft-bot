const { SlashCommandBuilder } = require('discord.js');
const { getUserProfile } = require('../../utils/database');
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
            return interaction.reply({ content: 'לבוטים אין נקודות XP או רמות!', ephemeral: true });
        }

        const profile = getUserProfile(interaction.guildId, targetUser.id);
        const xp = profile.xp || 0;
        const level = profile.level || Math.floor(xp / 150);

        const currentLevelBaseXP = level * 150;
        const xpInCurrentLevel = xp - currentLevelBaseXP;
        const progressPercent = Math.min(100, Math.floor((xpInCurrentLevel / 150) * 100));

        // Create visual progress bar
        const totalBlocks = 10;
        const filledBlocks = Math.round((progressPercent / 100) * totalBlocks);
        const emptyBlocks = totalBlocks - filledBlocks;
        const progressBar = '🟩'.repeat(filledBlocks) + '⬛'.repeat(emptyBlocks);

        const embed = createEmbed({
            title: `📊 פרופיל דרגה ו-XP`,
            thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
            color: COLORS.PRIMARY,
            fields: [
                { name: '👤 משתמש', value: `${targetUser}`, inline: true },
                { name: '⭐ רמה', value: `**${level}**`, inline: true },
                { name: '✨ סה"כ XP', value: `**${xp}** XP`, inline: true },
                { name: `📈 התקדמות לרמה ${level + 1}`, value: `${progressBar} **${progressPercent}%** (${xpInCurrentLevel}/150 XP)`, inline: false }
            ],
            footerText: 'מרוויחים 5 XP על כל הודעה בשרת!'
        });

        await interaction.reply({ embeds: [embed] });
    }
};
