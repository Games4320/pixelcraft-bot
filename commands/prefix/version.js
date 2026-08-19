const { createEmbed, createSuccessEmbed, createErrorEmbed, COLORS } = require('../../utils/embedBuilder');
const { getGuildConfig, updateGuildConfig } = require('../../utils/database');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'version',
    description: 'מציג את גרסת ה-Minecraft הנתמכת בשרת',
    async execute(message, args) {
        const config = getGuildConfig(message.guild.id);
        const serverVersion = config.serverVersion || '1.21.8+';

        const embed = createEmbed({
            title: `📌 גרסת שרת ה-Minecraft - ${message.guild.name}`,
            description: `גרסת ה-Minecraft הנתמכת להתחברות ל-**${message.guild.name}**:`,
            color: COLORS.INFO,
            fields: [
                { name: 'גרסה נתמכת', value: `\`\`\`${serverVersion}\`\`\``, inline: false }
            ],
            footerText: `${message.guild.name} Bot • תואם לגרסאות Minecraft ${serverVersion}!`
        });

        await message.reply({ embeds: [embed] });
    }
};
