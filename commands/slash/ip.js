const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../utils/database');
const { createEmbed, createSuccessEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ip')
        .setDescription('הצגת או הגדרת כתובת ה-IP של שרת ה-Minecraft')
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('הצגת כתובת ה-IP של השרת')
        )
        .addSubcommandGroup(group =>
            group.setName('set')
                .setDescription('הגדרת כתובת ה-IP של השרת (למנהלים בלבד)')
                .addSubcommand(sub =>
                    sub.setName('ip')
                        .setDescription('הגדרת כתובת ה-IP של שרת ה-Minecraft')
                        .addStringOption(opt =>
                            opt.setName('server_ip')
                                .setDescription('כתובת ה-IP של שרת ה-Minecraft (לדוגמה: play.server.net)')
                                .setRequired(true)
                        )
                )
        ),
    async execute(interaction) {
        const group = interaction.options.getSubcommandGroup(false);
        const sub = interaction.options.getSubcommand();

        if (group === 'set' && sub === 'ip') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ דרושות הרשאות ניהול שרת כדי להגדיר את כתובת ה-IP.', ephemeral: true });
            }

            const newIp = interaction.options.getString('server_ip').trim();
            updateGuildConfig(interaction.guildId, 'serverIp', newIp);

            const embed = createSuccessEmbed(
                'כתובת ה-IP עודכנה בהצלחה',
                `כתובת ה-IP של שרת ה-Minecraft עודכנה בהצלחה עבור **${interaction.guild.name}**!\n\n` +
                `**הכתובת החדשה:**\n\`\`\`${newIp}\`\`\`\n` +
                `מעתה, כאשר שחקנים ירשמו \`!ip\` או \`/ip\`, תוצג כתובת זו.`
            );

            return interaction.reply({ embeds: [embed] });
        }

        // View IP
        const config = getGuildConfig(interaction.guildId);
        const serverIp = config.serverIp || 'טרם הוגדרה כתובת IP (מנהלים יכולים להגדיר באמצעות /ip set ip)';

        const embed = createEmbed({
            title: `🎮 כתובת שרת ה-Minecraft - ${interaction.guild.name}`,
            description: `התחבר לשרת ה-Minecraft של **${interaction.guild.name}** באמצעות הכתובת הבאה:`,
            color: COLORS.INFO,
            fields: [
                { name: 'כתובת השרת (IP)', value: `\`\`\`${serverIp}\`\`\``, inline: false }
            ],
            footerText: `${interaction.guild.name} Bot • העתק והדבק ברשימת השרתים ב-Minecraft!`
        });

        return interaction.reply({ embeds: [embed] });
    }
};
