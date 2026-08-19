const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'staff',
    description: 'מציג רשימה של חברי צוות השרת',
    async execute(message) {
        try {
            await message.guild.members.fetch();

            const staffRoles = message.guild.roles.cache.filter(
                role => role.name.toLowerCase().includes('staff') ||
                        role.name.toLowerCase().includes('admin') ||
                        role.name.toLowerCase().includes('mod') ||
                        role.name.includes('צוות') ||
                        role.name.includes('מנהל')
            );

            if (staffRoles.size === 0) {
                const embed = createEmbed({
                    title: `🛡️ צוות השרת - ${message.guild.name}`,
                    description: `לא נמצאו תפקידי צוות בשרת **${message.guild.name}** (כגון Staff, Admin, צוות, מנהל).`,
                    color: COLORS.WARNING,
                    footerText: `${message.guild.name} • רשימת צוות`
                });
                return message.reply({ embeds: [embed] });
            }

            const staffMembers = message.guild.members.cache.filter(member =>
                !member.user.bot && member.roles.cache.some(r => staffRoles.has(r.id))
            );

            if (staffMembers.size === 0) {
                const embed = createEmbed({
                    title: `🛡️ צוות השרת - ${message.guild.name}`,
                    description: `אין כרגע משתמשים עם תפקיד צוות משויך בשרת **${message.guild.name}**.`,
                    color: COLORS.WARNING,
                    footerText: `${message.guild.name} • רשימת צוות`
                });
                return message.reply({ embeds: [embed] });
            }

            const staffList = staffMembers.map(m => {
                const topStaffRole = m.roles.cache
                    .filter(r => staffRoles.has(r.id))
                    .sort((a, b) => b.position - a.position)
                    .first();
                return `• ${m.user} (${m.user.tag}) - ${topStaffRole ? topStaffRole : 'צוות'}`;
            }).join('\n');

            const embed = createEmbed({
                title: `🛡️ צוות השרת - ${message.guild.name}`,
                description: staffList.length > 3900 ? staffList.substring(0, 3900) + '...\n*(הרשימה קוצרה)*' : staffList,
                color: COLORS.PRIMARY,
                footerText: `${message.guild.name} • סה"כ חברי צוות: ${staffMembers.size}`
            });

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing !staff command:', error);
            message.reply('אירעה שגיאה שטעינת רשימת הצוות.');
        }
    }
};
