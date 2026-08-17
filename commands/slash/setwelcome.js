const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuildConfig } = require('../../utils/database');
const { createSuccessEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('הגדרת הודעת ברוכים הבאים מותאמת אישית לערוץ זה')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('תבנית ההודעה. משתנים: {join} למצטרף, {inviter} למזמין')
                .setRequired(true)
        ),
    async execute(interaction) {
        const welcomeMessage = interaction.options.getString('message');
        const channelId = interaction.channelId;

        updateGuildConfig(interaction.guildId, 'welcome', {
            channelId,
            message: welcomeMessage
        });

        const embed = createSuccessEmbed(
            'הודעת ברוכים הבאים הוגדרה בהצלחה',
            `הודעת ברוכים הבאים הוגדרה עבור הערוץ <#${channelId}>!\n\n` +
            `**תבנית ההודעה:**\n${welcomeMessage}\n\n` +
            `**משתנים נתמכים:**\n` +
            `• \`{join}\` — מתייג את החבר החדש שהצטרף\n` +
            `• \`{inviter}\` — מתייג את החבר שהזמין אותו`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
