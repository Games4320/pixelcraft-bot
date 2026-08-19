const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'version',
    description: 'מציג את גרסת ה-Minecraft הנתמכת בשרת',
    async execute(message) {
        const embed = createEmbed({
            title: `📌 גרסת שרת ה-Minecraft - ${message.guild.name}`,
            description: `גרסת ה-Minecraft הנתמכת להתחברות ל-**${message.guild.name}**:`,
            color: COLORS.INFO,
            fields: [
                { name: 'גרסה נתמכת', value: '```1.21.8+```', inline: false }
            ],
            footerText: `${message.guild.name} • תואם לגרסאות Minecraft 1.21.8 ומעלה!`
        });

        await message.reply({ embeds: [embed] });
    }
};
