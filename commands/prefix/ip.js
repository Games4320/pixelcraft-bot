const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'ip',
    description: 'מציג את כתובת ה-IP של שרת ה-Minecraft',
    async execute(message) {
        const embed = createEmbed({
            title: `🎮 כתובת שרת ה-Minecraft - ${message.guild.name}`,
            description: `התחבר לשרת ה-Minecraft של **${message.guild.name}** באמצעות הכתובת הבאה:`,
            color: COLORS.INFO,
            fields: [
                { name: 'כתובת השרת (IP)', value: '```play.birzia.co.il```', inline: false }
            ],
            footerText: `${message.guild.name} • העתק והדבק ברשימת השרתים ב-Minecraft!`
        });

        await message.reply({ embeds: [embed] });
    }
};
