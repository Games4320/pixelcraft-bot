const { SlashCommandBuilder } = require('discord.js');
const { readDB } = require('../../utils/database');
const { createEmbed, COLORS } = require('../../utils/embedBuilder');

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('הצגת לוח מובילי ה-XP והרמות בשרת (Leaderboard)'),
    async execute(interaction) {
        const guildId = interaction.guildId;
        const db = readDB();
        const users = db.users || {};

        const guildUsers = [];
        for (const [key, profile] of Object.entries(users)) {
            if (key.startsWith(`${guildId}_`)) {
                const userId = key.split('_')[1];
                const xp = profile.xp || 0;
                const level = profile.level || Math.floor(xp / 150);
                if (xp > 0) {
                    guildUsers.push({ userId, xp, level });
                }
            }
        }

        guildUsers.sort((a, b) => b.xp - a.xp);

        if (guildUsers.length === 0) {
            const embed = createEmbed({
                title: `🏆 לוח מובילי XP - ${interaction.guild.name}`,
                description: 'עדיין אין נתוני XP בשרת זה! שלחו הודעות בצ\'אט כדי לצבור XP ולעלות בדירוג.',
                color: COLORS.WARNING,
                footerText: `${interaction.guild.name} Bot • לוח מובילים`
            });
            return interaction.reply({ embeds: [embed] });
        }

        const top10 = guildUsers.slice(0, 10);
        let listText = '';

        for (let i = 0; i < top10.length; i++) {
            const entry = top10[i];
            const medal = MEDALS[i] || `\`#${i + 1}\``;
            listText += `${medal} <@${entry.userId}> — **${entry.xp.toLocaleString()} XP** (רמה **${entry.level}**)\n`;
        }

        // Find caller position
        const userIndex = guildUsers.findIndex(u => u.userId === interaction.user.id);
        let userRankText = 'טרם צברת XP';
        if (userIndex !== -1) {
            const myEntry = guildUsers[userIndex];
            userRankText = `מקום **#${userIndex + 1}** מתוך ${guildUsers.length} • **${myEntry.xp.toLocaleString()} XP** (רמה ${myEntry.level})`;
        }

        const embed = createEmbed({
            title: `🏆 לוח מובילי ה-XP - ${interaction.guild.name}`,
            description: `להלן 10 המשתמשים המובילים ב-**${interaction.guild.name}**:\n\n${listText}`,
            color: COLORS.PRIMARY,
            thumbnail: interaction.guild.iconURL({ dynamic: true }),
            fields: [
                { name: '📍 המיקום שלך בדירוג:', value: userRankText, inline: false }
            ],
            footerText: `${interaction.guild.name} Bot • +5 XP לכל הודעה בצ'אט`
        });

        await interaction.reply({ embeds: [embed] });
    }
};
