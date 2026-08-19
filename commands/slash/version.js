const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../utils/database');
const { createEmbed, createSuccessEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('version')
        .setDescription('הצגת או הגדרת גרסת ה-Minecraft הנתמכת בשרת')
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('הצגת גרסת ה-Minecraft הנתמכת בשרת')
        )
        .addSubcommandGroup(group =>
            group.setName('set')
                .setDescription('הגדרת גרסת ה-Minecraft הנתמכת בשרת (למנהלים בלבד)')
                .addSubcommand(sub =>
                    sub.setName('version')
                        .setDescription('הגדרת גרסת ה-Minecraft הנתמכת')
                        .addStringOption(opt =>
                            opt.setName('version')
                                .setDescription('גרסת ה-Minecraft (לדוגמה: 1.21.8+, 1.20 - 1.21)')
                                .setRequired(true)
                        )
                )
        ),
    async execute(interaction) {
        const group = interaction.options.getSubcommandGroup(false);
        const sub = interaction.options.getSubcommand();

        if (group === 'set' && sub === 'version') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ דרושות הרשאות ניהול שרת כדי להגדיר את גרסת השרת.', ephemeral: true });
            }

            const newVersion = interaction.options.getString('version').trim();
            updateGuildConfig(interaction.guildId, 'serverVersion', newVersion);

            const embed = createSuccessEmbed(
                'גרסת השרת עודכנה בהצלחה',
                `גרסת ה-Minecraft הנתמכת עודכנה בהצלחה עבור **${interaction.guild.name}**!\n\n` +
                `**הגרסה החדשה:**\n\`\`\`${newVersion}\`\`\`\n` +
                `מעתה, כאשר שחקנים ירשמו \`!version\` או \`/version\`, תוצג גרסה זו.`
            );

            return interaction.reply({ embeds: [embed] });
        }

        // View Version
        const config = getGuildConfig(interaction.guildId);
        const serverVersion = config.serverVersion || '1.21.8+';

        const embed = createEmbed({
            title: `📌 גרסת שרת ה-Minecraft - ${interaction.guild.name}`,
            description: `גרסת ה-Minecraft הנתמכת להתחברות ל-**${interaction.guild.name}**:`,
            color: COLORS.INFO,
            fields: [
                { name: 'גרסה נתמכת', value: `\`\`\`${serverVersion}\`\`\``, inline: false }
            ],
            footerText: `${interaction.guild.name} • תואם לגרסאות Minecraft ${serverVersion}!`
        });

        return interaction.reply({ embeds: [embed] });
    }
};
