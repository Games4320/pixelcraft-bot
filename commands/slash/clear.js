const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('מחיקת כמות הודעות מוגדרת מהערוץ הנוכחי')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option.setName('message_amount')
                .setDescription('כמות ההודעות למחיקה (בין 1 ל-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription('מחיקת הודעות של משתמש ספציפי בלבד (אופציונלי)')
                .setRequired(false)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                embeds: [createErrorEmbed('❌ אין לך הרשאה מתאימה (ניהול הודעות - Manage Messages) לביצוע פקודה זו.')],
                ephemeral: true
            });
        }

        const amount = interaction.options.getInteger('message_amount') || interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        const channel = interaction.channel;

        await interaction.deferReply({ ephemeral: true });

        try {
            if (targetUser) {
                // Fetch up to 100 messages and filter by user
                const messages = await channel.messages.fetch({ limit: 100 });
                const userMessages = messages.filter(m => m.author.id === targetUser.id).first(amount);

                if (userMessages.length === 0) {
                    return interaction.editReply({
                        embeds: [createErrorEmbed(`לא נמצאו הודעות של ${targetUser} ב-100 ההודעות האחרונות.`)]
                    });
                }

                const deleted = await channel.bulkDelete(userMessages, true);
                const embed = createSuccessEmbed(
                    'הודעות נמחקו בהצלחה',
                    `🧹 נמחקו בהצלחה **${deleted.size}** הודעות של ${targetUser} מהערוץ!`
                );
                return interaction.editReply({ embeds: [embed] });
            } else {
                const deleted = await channel.bulkDelete(amount, true);
                const embed = createSuccessEmbed(
                    'הודעות נמחקו בהצלחה',
                    `🧹 נמחקו בהצלחה **${deleted.size}** הודעות מהערוץ!`
                );
                return interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error clearing messages:', error);
            return interaction.editReply({
                embeds: [createErrorEmbed('אירעה שגיאה בעת מחיקת ההודעות. שים לב: דיסקורד אינו מאפשר מחיקה אוטומטית של הודעות ישנות מ-14 ימים.')]
            });
        }
    }
};
