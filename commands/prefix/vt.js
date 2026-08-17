const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'vt',
    description: 'בדיקת תאריך הצטרפות לשרת וזכאות לתפקיד וותיק',
    async execute(message) {
        const member = message.member;
        if (!member || !member.joinedAt) {
            return message.reply('לא ניתן לקבוע את תאריך ההצטרפות שלך לשרת.');
        }

        const joinDate = member.joinedAt;
        const now = new Date();
        const diffMs = now - joinDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffMonths = (diffMs / (1000 * 60 * 60 * 24 * 30.4375)).toFixed(1);

        // Threshold: 6+ months = ~180 days
        const VETERAN_THRESHOLD_DAYS = 180;
        const qualifies = diffDays >= VETERAN_THRESHOLD_DAYS;

        // Check if server has VETERAN role
        const veteranRole = message.guild.roles.cache.find(
            r => r.name.toUpperCase() === 'VETERAN' || r.name === 'וותיק' || r.name === 'ותיק'
        );

        let roleStatusText = 'לא שויך תפקיד';
        if (qualifies) {
            if (veteranRole) {
                if (member.roles.cache.has(veteranRole.id)) {
                    roleStatusText = `✅ כבר יש לך את התפקיד **${veteranRole.name}**!`;
                } else {
                    roleStatusText = `🎖️ אתה זכאי לתפקיד **${veteranRole.name}**!`;
                    try {
                        await member.roles.add(veteranRole);
                        roleStatusText += ' *(התפקיד שויך אליך אוטומטית!)*';
                    } catch (err) {
                        roleStatusText += ' *(פנה לצוות כדי לקבל את התפקיד)*';
                    }
                }
            } else {
                roleStatusText = '✅ אתה זכאי! (הערה: התפקיד "VETERAN" / "ותיק" לא נמצא בשרת)';
            }
        } else {
            const daysRemaining = VETERAN_THRESHOLD_DAYS - diffDays;
            roleStatusText = `⏳ עליך להישאר עוד **${daysRemaining} ימים** בשרת כדי לפתוח מעמד וותיק.`;
        }

        const embed = createEmbed({
            title: '🎖️ בדיקת מעמד וותיק (Veteran)',
            color: qualifies ? COLORS.SUCCESS : COLORS.WARNING,
            thumbnail: member.user.displayAvatarURL({ dynamic: true }),
            fields: [
                { name: '👤 משתמש', value: `${member.user} (${member.user.tag})`, inline: true },
                { name: '📅 הצטרף לשרת', value: `<t:${Math.floor(joinDate.getTime() / 1000)}:F>\n(<t:${Math.floor(joinDate.getTime() / 1000)}:R>)`, inline: true },
                { name: '⏱️ זמן בשרת', value: `**${diffDays}** ימים (~${diffMonths} חודשים)`, inline: true },
                { name: '🎖️ זכאות לוותיק (6+ חודשים)', value: qualifies ? '🟢 **זכאי**' : '🔴 **עדיין לא זכאי**', inline: true },
                { name: '📌 סטטוס תפקיד', value: roleStatusText, inline: false }
            ]
        });

        await message.reply({ embeds: [embed] });
    }
};
