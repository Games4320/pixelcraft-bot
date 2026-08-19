const { createEmbed, createSuccessEmbed, createErrorEmbed, COLORS } = require('../../utils/embedBuilder');
const { getGuildConfig, updateGuildConfig } = require('../../utils/database');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'version',
    description: 'מציג את גרסת ה-Minecraft הנתמכת בשרת (ומאפשר למנהלים להגדירה)',
    async execute(message, args) {
        // Admin configuration: !version set <version> or !version set version <version>
        if (args[0] && args[0].toLowerCase() === 'set') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return message.reply({ embeds: [createErrorEmbed('❌ דרושות הרשאות ניהול שרת כדי להגדיר את גרסת השרת.')] });
            }

            let newVersion = '';
            if (args[1] && args[1].toLowerCase() === 'version') {
                newVersion = args.slice(2).join(' ').trim();
            } else {
                newVersion = args.slice(1).join(' ').trim();
            }

            if (!newVersion) {
                return message.reply({
                    embeds: [createErrorEmbed(
                        'אנא ציין את גרסת ה-Minecraft הנתמכת.\n' +
                        '**שימוש:** `!version set <גרסה>` או `/version set version <גרסה>`\n' +
                        '**דוגמה:** `!version set 1.21.8+`'
                    )]
                });
            }

            updateGuildConfig(message.guild.id, 'serverVersion', newVersion);

            const successEmbed = createSuccessEmbed(
                'גרסת השרת עודכנה בהצלחה',
                `גרסת ה-Minecraft הנתמכת עודכנה בהצלחה עבור **${message.guild.name}**!\n\n` +
                `**הגרסה החדשה:**\n\`\`\`${newVersion}\`\`\`\n` +
                `מעתה, פקודות \`!version\` ו-\`/version\` יציגו גרסה זו.`
            );

            return message.reply({ embeds: [successEmbed] });
        }

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
