const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuildConfig } = require('../../utils/database');
const { createSuccessEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('h-set-message')
        .setDescription('הגדרת תבנית ההודעה הנשלחת כאשר משתמש מריץ !h <סיבה>')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('תבנית ההודעה. משתנים נתמכים: {reason} לסיבה, {category} לקטגוריה')
                .setRequired(true)
        ),
    async execute(interaction) {
        const template = interaction.options.getString('message');

        updateGuildConfig(interaction.guildId, 'hMessage', template);

        const embed = createSuccessEmbed(
            'תבנית הודעת תמיכה עודכנה בהצלחה',
            `תבנית ההודעה עבור \`!h\` עודכנה בהצלחה!\n\n` +
            `**התבנית החדשה:**\n${template}\n\n` +
            `**משתנים נתמכים:**\n` +
            `• \`{reason}\` — יוחלף בסיבה שהזין המשתמש\n` +
            `• \`{category}\` — יוחלף בקטגוריה של הפנייה`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
