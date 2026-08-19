const { createEmbed, createSuccessEmbed, createErrorEmbed, COLORS } = require('../../utils/embedBuilder');
const { getGuildConfig, updateGuildConfig } = require('../../utils/database');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'ip',
    description: 'מציג את כתובת ה-IP של שרת ה-Minecraft',
    async execute(message, args) {
        const config = getGuildConfig(message.guild.id);
        const serverIp = config.serverIp || 'טרם הוגדרה כתובת IP (מנהלים יכולים להגדיר באמצעות /ip set)';

        const embed = createEmbed({
            title: `🎮 כתובת שרת ה-Minecraft - ${message.guild.name}`,
            description: `התחבר לשרת ה-Minecraft של **${message.guild.name}** באמצעות הכתובת הבאה:`,
            color: COLORS.INFO,
            fields: [
                { name: 'כתובת השרת (IP)', value: `\`\`\`${serverIp}\`\`\``, inline: false }
            ],
            footerText: `${message.guild.name} Bot • העתק והדבק ברשימת השרתים ב-Minecraft!`
        });

        await message.reply({ embeds: [embed] });
    }
};
