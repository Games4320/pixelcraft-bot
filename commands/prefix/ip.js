const { createEmbed, createSuccessEmbed, createErrorEmbed, COLORS } = require('../../utils/embedBuilder');
const { getGuildConfig, updateGuildConfig } = require('../../utils/database');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'ip',
    description: 'מציג את כתובת ה-IP של שרת ה-Minecraft (ומאפשר למנהלים להגדירה)',
    async execute(message, args) {
        // Admin configuration: !ip set <ip> or !ip set ip <ip>
        if (args[0] && args[0].toLowerCase() === 'set') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return message.reply({ embeds: [createErrorEmbed('❌ דרושות הרשאות ניהול שרת כדי להגדיר את כתובת ה-IP.')] });
            }

            let newIp = '';
            if (args[1] && args[1].toLowerCase() === 'ip') {
                newIp = args.slice(2).join(' ').trim();
            } else {
                newIp = args.slice(1).join(' ').trim();
            }

            if (!newIp) {
                return message.reply({
                    embeds: [createErrorEmbed(
                        'אנא ציין את כתובת ה-IP של השרת.\n' +
                        '**שימוש:** `!ip set <ip>` או `/ip set ip <ip>`\n' +
                        '**דוגמה:** `!ip set play.myserver.net`'
                    )]
                });
            }

            updateGuildConfig(message.guild.id, 'serverIp', newIp);

            const successEmbed = createSuccessEmbed(
                'כתובת ה-IP עודכנה בהצלחה',
                `כתובת ה-IP של שרת ה-Minecraft עודכנה בהצלחה עבור **${message.guild.name}**!\n\n` +
                `**הכתובת החדשה:**\n\`\`\`${newIp}\`\`\`\n` +
                `מעתה, פקודות \`!ip\` ו-\`/ip\` יציגו כתובת זו.`
            );

            return message.reply({ embeds: [successEmbed] });
        }

        const config = getGuildConfig(message.guild.id);
        const serverIp = config.serverIp || 'play.birzia.co.il';

        const embed = createEmbed({
            title: `🎮 כתובת שרת ה-Minecraft - ${message.guild.name}`,
            description: `התחבר לשרת ה-Minecraft של **${message.guild.name}** באמצעות הכתובת הבאה:`,
            color: COLORS.INFO,
            fields: [
                { name: 'כתובת השרת (IP)', value: `\`\`\`${serverIp}\`\`\``, inline: false }
            ],
            footerText: `${message.guild.name} • העתק והדבק ברשימת השרתים ב-Minecraft!`
        });

        await message.reply({ embeds: [embed] });
    }
};
