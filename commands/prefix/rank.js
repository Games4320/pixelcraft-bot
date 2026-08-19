const { getUserProfile, getXPProgress } = require('../../utils/database');
const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'rank',
    aliases: ['level', 'xp'],
    description: 'בדיקת ה-XP, הרמה וההתקדמות שלך או של משתמש אחר',
    async execute(message, args) {
        const targetUser = message.mentions.users.first() || message.author;

        if (targetUser.bot) {
            return message.reply('❌ לבוטים אין נקודות XP או רמות!');
        }

        const profile = getUserProfile(message.guild.id, targetUser.id);
        const progress = getXPProgress(profile.xp);

        // Create visual progress bar (10 blocks)
        const totalBlocks = 10;
        const filledBlocks = Math.min(totalBlocks, Math.max(0, Math.round((progress.percent / 100) * totalBlocks)));
        const emptyBlocks = totalBlocks - filledBlocks;
        const progressBar = '🟩'.repeat(filledBlocks) + '⬛'.repeat(emptyBlocks);

        const embed = createEmbed({
            title: `📊 פרופיל דרגה ו-XP`,
            thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
            color: COLORS.PRIMARY,
            fields: [
                { name: '👤 משתמש', value: `${targetUser}`, inline: true },
                { name: '⭐ רמה נוכחית', value: `**רמה ${progress.level}**`, inline: true },
                { name: '✨ סה"כ XP', value: `**${progress.totalXP.toLocaleString()}** XP *(מצטבר לתמיד)*`, inline: true },
                { 
                    name: `📈 התקדמות לרמה ${progress.level + 1}`, 
                    value: `${progressBar} **${progress.percent}%**\n` +
                           `• סה"כ התקדמות: **${progress.totalXP.toLocaleString()} / ${progress.nextLevelTotalXP.toLocaleString()} XP**\n` +
                           `• נותרו עוד **${progress.xpRemainingToNextLevel} XP** לרמה **${progress.level + 1}**`, 
                    inline: false 
                },
                { name: '💬 סה"כ הודעות בצ\'אט', value: `\`${(profile.messages || 0).toLocaleString()}\``, inline: true }
            ],
            footerText: `${message.guild.name} • מרוויחים 15-25 XP על כל הודעה בצ'אט (ה-XP נשמר לתמיד!)`
        });

        await message.channel.send({ embeds: [embed] });
    }
};