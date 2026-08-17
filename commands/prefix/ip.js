const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'ip',
    description: 'מציג את כתובת ה-IP של שרת ה-Minecraft',
    async execute(message) {
        const embed = createEmbed({
            title: '🎮 כתובת שרת ה-Minecraft',
            description: 'התחבר לשרת ה-Minecraft שלנו באמצעות הכתובת הבאה:',
            color: COLORS.INFO,
            fields: [
                { name: 'כתובת השרת (IP)', value: '```play.birzia.co.il```', inline: false }
            ],
            footerText: 'העתק והדבק ברשימת השרתים שלכם ב-Minecraft!'
        });

        await message.reply({ embeds: [embed] });
    }
};
