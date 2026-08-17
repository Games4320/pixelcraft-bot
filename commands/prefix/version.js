const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'version',
    description: 'מציג את גרסת ה-Minecraft הנתמכת בשרת',
    async execute(message) {
        const embed = createEmbed({
            title: '📌 גרסת שרת ה-Minecraft',
            description: 'גרסת ה-Minecraft הנתמכת להתחברות:',
            color: COLORS.INFO,
            fields: [
                { name: 'גרסה נתמכת', value: '```1.21.8+```', inline: false }
            ],
            footerText: 'תואם לגרסאות Minecraft 1.21.8 וחדשות יותר!'
        });

        await message.reply({ embeds: [embed] });
    }
};
