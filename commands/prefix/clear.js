const { PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    name: 'clear',
    aliases: ['purge', 'clean'],
    description: 'מחיקת כמות הודעות מוגדרת מהערוץ',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply({
                embeds: [createErrorEmbed('❌ אין לך הרשאה מתאימה (ניהול הודעות - Manage Messages) לביצוע פקודה זו.')]
            });
        }

        const rawAmount = args[0];
        const amount = parseInt(rawAmount, 10);

        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply({
                embeds: [createErrorEmbed(
                    'אנא ציין כמות תקינה של הודעות למחיקה בין 1 ל-100.\n' +
                    '**שימוש:** `!clear <כמות>` או `/clear amount:<כמות>`\n' +
                    '**דוגמה:** `!clear 10`'
                )]
            });
        }

        try {
            // Delete command message + requested amount
            await message.delete().catch(() => {});

            const deleted = await message.channel.bulkDelete(amount, true);
            const confirmation = await message.channel.send({
                embeds: [createSuccessEmbed('הודעות נמחקו בהצלחה', `🧹 נמחקו בהצלחה **${deleted.size}** הודעות מהערוץ!`)]
            });

            // Auto-delete confirmation message after 5 seconds
            setTimeout(() => {
                confirmation.delete().catch(() => {});
            }, 5000);
        } catch (error) {
            console.error('Error clearing messages:', error);
            return message.channel.send({
                embeds: [createErrorEmbed('אירעה שגיאה בעת מחיקת ההודעות. שים לב: דיסקורד אינו מאפשר מחיקה של הודעות ישנות מ-14 יום.')]
            });
        }
    }
};
