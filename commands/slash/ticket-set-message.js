const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuildConfig } = require('../../utils/database');
const { createSuccessEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-set-message')
        .setDescription('הגדרת הודעת פתיחה מותאמת אישית בעת פתיחת טיקט')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('תוכן ההודעה שתוצג בטיקט (משתנים: {user}, {username}, {server}, {category})')
                .setRequired(true)
        ),
    async execute(interaction) {
        const customMessage = interaction.options.getString('message');
        updateGuildConfig(interaction.guildId, 'ticketMessage', customMessage);

        const embed = createSuccessEmbed(
            'הודעת פתיחת טיקט עודכנה בהצלחה',
            `הודעת הפתיחה שתוצג למשתמשים בעת פתיחת טיקט חדש בשרת **${interaction.guild.name}** עודכנה!\n\n` +
            `**ההודעה החדשה:**\n${customMessage}\n\n` +
            `**משתנים נתמכים שיוחלפו אוטומטית:**\n` +
            `• \`{user}\` / \`{member}\` — תיוג המשתמש שפתח את הטיקט\n` +
            `• \`{username}\` — שם המשתמש שפתח את הטיקט\n` +
            `• \`{server}\` — שם השרת (${interaction.guild.name})\n` +
            `• \`{category}\` — קטגוריית הטיקט שנבחרה`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
