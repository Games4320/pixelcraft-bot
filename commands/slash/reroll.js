const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { rerollGiveaway } = require('../../utils/giveawayManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reroll')
        .setDescription('בחירת זוכה חדש להגרלה שהסתיימה (Reroll)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('מזהה ההודעה של ההגרלה (Message ID)')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                content: '❌ דרושות הרשאות ניהול שרת כדי לבצע הגרלה מחדש.',
                ephemeral: true
            });
        }

        const messageId = interaction.options.getString('message_id').trim();
        await rerollGiveaway(interaction, messageId);
    }
};
