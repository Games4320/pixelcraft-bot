const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuildConfig } = require('../../utils/database');
const { createSuccessEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('h-set-claim-perm')
        .setDescription('הגדרת התפקיד המורשה לשייך פניות תמיכה של !h (Claim)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('התפקיד שיהיה מורשה ללחוץ על כפתור "שייך אליי"')
                .setRequired(true)
        ),
    async execute(interaction) {
        const role = interaction.options.getRole('role');

        updateGuildConfig(interaction.guildId, 'hClaimRole', role.id);

        const embed = createSuccessEmbed(
            'הרשאת שיוך פניות עודכנה בהצלחה',
            `התפקיד המורשה לשייך פניות תמיכה (\`!h\`) הוגדר ל-**${role}**!\n\n` +
            `רק חברי צוות בעלי תפקיד זה (או מנהלי שרת) יוכלו ללחוץ על הכפתור **📌 שייך אליי**.`
        );

        await interaction.reply({ embeds: [embed] });
    }
};
