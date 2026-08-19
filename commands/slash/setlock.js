const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuildConfig } = require('../../utils/database');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlock')
        .setDescription('הגדרות נעילת חירום לשרת')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand.setName('role')
                .setDescription('הגדרת התפקיד הזמני שאליו מורדים אנשי הצוות בעת נעילת חירום (/lockserver)')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('התפקיד שיוענק לאנשי הצוות בעת נעילה')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                embeds: [createErrorEmbed('דרושות הרשאות **ניהול שרת** כדי להשתמש בפקודה זו!')],
                ephemeral: true
            });
        }

        const role = interaction.options.getRole('role');
        updateGuildConfig(interaction.guildId, 'lockdownRoleId', role.id);

        return interaction.reply({
            embeds: [createSuccessEmbed(
                'רול נעילת חירום הוגדר בהצלחה 🛡️',
                `התפקיד ${role} הוגדר כתפקיד הנעילה של השרת!\n` +
                `בעת הפעלת פקודת הנעילה \`/lockserver\`, כל אנשי הצוות בעלי הגישות (למעט הבעלים) יורדו לתפקיד זה וכל החדרים יינעלו.`
            )]
        });
    }
};