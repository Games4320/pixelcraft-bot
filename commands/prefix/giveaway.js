const { PermissionFlagsBits } = require('discord.js');
const { startGiveaway, rerollGiveaway, endGiveaway } = require('../../utils/giveawayManager');
const { createEmbed, createErrorEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'giveaway',
    description: 'ניהול מערכת הגרלות (יצירה, הגרלה חוזרת, סיום)',
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply({ embeds: [createErrorEmbed('❌ דרושות הרשאות ניהול שרת כדי לנהל הגרלות.')] });
        }

        const sub = args[0] ? args[0].toLowerCase() : '';

        // 1. !giveaway create {time} {winners} {prize}
        if (sub === 'create' || sub === 'start') {
            const timeStr = args[1];
            const winnerCount = parseInt(args[2], 10);
            const prize = args.slice(3).join(' ').trim();

            if (!timeStr || isNaN(winnerCount) || !prize) {
                return message.reply({
                    embeds: [createErrorEmbed(
                        'שימוש לא תקין בפקודה!\n' +
                        '**שימוש:** `!giveaway create <זמן> <מספר זוכים> <פרס>` או `/giveaway create`\n' +
                        '**דוגמה:** `!giveaway create 10m 1 1000XP`\n' +
                        '**דוגמה נוספת:** `!giveaway create 1d 2 ניטרו קלאסיק`'
                    )]
                });
            }

            // Create a fake interaction wrapper for prefix compatibility
            const fakeInteraction = {
                guild: message.guild,
                guildId: message.guild.id,
                channel: message.channel,
                channelId: message.channel.id,
                user: message.author,
                reply: async (opts) => {
                    return message.channel.send(typeof opts === 'string' ? opts : {
                        content: opts.content,
                        embeds: opts.embeds,
                        components: opts.components
                    });
                }
            };

            return startGiveaway(client, fakeInteraction, { timeStr, winnerCount, prize });
        }

        // 2. !giveaway reroll {message_id}
        if (sub === 'reroll') {
            const messageId = args[1];
            if (!messageId) {
                return message.reply({
                    embeds: [createErrorEmbed(
                        'אנא ציין את מזהה ההודעה של ההגרלה (Message ID).\n' +
                        '**שימוש:** `!giveaway reroll <message_id>`'
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

        // 3. !giveaway end {message_id}
        if (sub === 'end') {
            const messageId = args[1];
            if (!messageId) {
                return message.reply({
                    embeds: [createErrorEmbed('אנא ציין את מזהה ההודעה של ההגרלה לסיום מוקדם.\n**שימוש:** `!giveaway end <message_id>`')]
                });
            }

            await endGiveaway(client, messageId);
            return message.reply(`✅ ההגרלה (${messageId}) הסתיימה בהצלחה.`);
        }

        // Default help
        const embed = createEmbed({
            title: `🎉 מערכת הגרלות - ${message.guild.name}`,
            description: 'להלן פקודות מערכת ההגרלות:\n\n' +
                         '• `!giveaway create <זמן> <זוכים> <פרס>` — יצירת הגרלה חדשה\n' +
                         '  *(לדוגמה: `!giveaway create 10m 1 1000XP`)*\n\n' +
                         '• `!giveaway reroll <message_id>` — הגרלה מחדש של זוכה\n\n' +
                         '• `!giveaway end <message_id>` — סיום הגרלה באופן מיידי',
            color: COLORS.PRIMARY,
            footerText: `${message.guild.name} • מערכת הגרלות`
        });

        return message.reply({ embeds: [embed] });
    }
};
