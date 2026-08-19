const { PermissionFlagsBits } = require('discord.js');
const { rerollGiveaway } = require('../../utils/giveawayManager');
const { createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    name: 'reroll',
    description: 'בחירת זוכה חדש להגרלה שהסתיימה',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply({ embeds: [createErrorEmbed('❌ דרושות הרשאות ניהול שרת כדי לבצע הגרלה מחדש.')] });
        }

        const messageId = args[0];
        if (!messageId) {
            return message.reply({
                embeds: [createErrorEmbed(
                    'אנא ציין את מזהה ההודעה של ההגרלה (Message ID).\n' +
                    '**שימוש:** `!reroll <message_id>` או `/reroll message_id:<ID>`'
                )]
            });
        }

        const fakeInteraction = {
            guild: message.guild,
            user: message.author,
            reply: async (opts) => {
                const content = typeof opts === 'string' ? opts : opts.content;
                return message.channel.send({ content, allowedMentions: { parse: ['users'] } });
            }
        };

        return rerollGiveaway(fakeInteraction, messageId);
    }
};
