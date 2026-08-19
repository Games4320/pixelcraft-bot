const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    PermissionFlagsBits
} = require('discord.js');
const { createEmbed, createSuccessEmbed, createErrorEmbed, COLORS } = require('../../utils/embedBuilder');
const { updateGuildConfig, getGuildConfig } = require('../../utils/database');

module.exports = {
    name: 'ticket',
    description: 'ניהול פניות וטיקטים (פאנל, הגדרת הודעה, סגירה)',
    async execute(message, args) {
        const sub = args[0] ? args[0].toLowerCase() : '';

        // 1. !ticket panel / !ticket setup
        if (sub === 'panel' || sub === 'setup') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return message.reply({ embeds: [createErrorEmbed('❌ דרושות הרשאות ניהול שרת כדי לשלוח את פאנל הטיקטים.')] });
            }

            const embed = createEmbed({
                title: `🎫 מרכז תמיכה וטיקטים - ${message.guild.name}`,
                description: `זקוק לעזרה או מעוניין לדווח על בעיה בשרת **${message.guild.name}**?\n\n` +
                             `בחר קטגוריה מהתפריט למטה כדי לפתוח ערוץ תמיכה פרטי עם צוות השרת.`,
                color: COLORS.PRIMARY,
                fields: [
                    { name: '🛠️ תמיכה', value: 'עזרה כללית, שאלות על המשחק או הבוט.', inline: true },
                    { name: '🚨 דיווח', value: 'דיווח על שחקן, הפרת חוקים או תקלה.', inline: true },
                    { name: '📝 בחינה לצוות', value: 'הגשת מועמדות ובחינה להצטרפות לצוות.', inline: true },
                    { name: '❓ אחר', value: 'פניות שונות, הצעות או נושאים אחרים.', inline: true }
                ],
                footerText: `${message.guild.name} • לחץ למטה לבחירת קטגוריה`
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_create_menu')
                .setPlaceholder('📩 בחר קטגוריה לפתיחת טיקט...')
                .addOptions([
                    new StringSelectMenuOptionBuilder()
                        .setLabel('תמיכה')
                        .setValue('support')
                        .setDescription('תמיכה כללית או עזרה במשחק')
                        .setEmoji('🛠️'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('דיווח')
                        .setValue('report')
                        .setDescription('דיווח על שחקן או הפרת חוקים')
                        .setEmoji('🚨'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('בחינה לצוות')
                        .setValue('staff_app')
                        .setDescription('הגשת מועמדות והצטרפות לצוות השרת')
                        .setEmoji('📝'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('אחר')
                        .setValue('other')
                        .setDescription('פניות אחרות או הצעות')
                        .setEmoji('❓')
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);
            return message.channel.send({ embeds: [embed], components: [row] });
        }

        // 2. !ticket set message <msg> / !ticket setmessage <msg> / !ticket set-message <msg>
        if (sub === 'set' || sub === 'setmessage' || sub === 'set-message') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return message.reply({ embeds: [createErrorEmbed('❌ דרושות הרשאות ניהול שרת כדי להגדיר את הודעת הטיקטים.')] });
            }

            let customMessage = '';
            if (sub === 'set') {
                if (args[1] && args[1].toLowerCase() === 'message') {
                    customMessage = args.slice(2).join(' ').trim();
                } else {
                    customMessage = args.slice(1).join(' ').trim();
                }
            } else {
                customMessage = args.slice(1).join(' ').trim();
            }

            if (!customMessage) {
                return message.reply({
                    embeds: [createErrorEmbed(
                        'אנא ספק את תוכן ההודעה.\n' +
                        '**שימוש:** `!ticket set message <הודעה>` או `/ticket set message`\n\n' +
                        '**משתנים נתמכים:** `{user}`, `{username}`, `{server}`, `{category}`\n' +
                        '**דוגמה:** `!ticket set message שלום {user}! ברוך הבא לטיקט בשרת {server}. צוות יטפל בך בהקדם.`'
                    )]
                });
            }

            updateGuildConfig(message.guild.id, 'ticketMessage', customMessage);

            const embed = createSuccessEmbed(
                'הודעת פתיחת טיקט עודכנה בהצלחה',
                `הודעת הפתיחה שתוצג למשתמשים בעת פתיחת טיקט חדש בשרת **${message.guild.name}** עודכנה!\n\n` +
                `**ההודעה החדשה:**\n${customMessage}\n\n` +
                `**משתנים נתמכים שיוחלפו אוטומטית:**\n` +
                `• \`{user}\` / \`{member}\` — תיוג המשתמש שפתח את הטיקט\n` +
                `• \`{username}\` — שם המשתמש שפתח את הטיקט\n` +
                `• \`{server}\` — שם השרת (${message.guild.name})\n` +
                `• \`{category}\` — קטגוריית הטיקט שנבחרה`
            );

            return message.reply({ embeds: [embed] });
        }

        // 3. !ticket reset-message / !ticket reset
        if (sub === 'reset' || sub === 'reset-message') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return message.reply({ embeds: [createErrorEmbed('❌ דרושות הרשאות ניהול שרת כדי לאפס את הודעת הטיקטים.')] });
            }

            updateGuildConfig(message.guild.id, 'ticketMessage', null);

            const embed = createSuccessEmbed(
                'הודעת הטיקט אופסה לברירת המחדל',
                `הודעת פתיחת הטיקט בשרת **${message.guild.name}** אופסה לתבניות ברירת המחדל לפי קטגוריה בהצלחה.`
            );

            return message.reply({ embeds: [embed] });
        }

        // 4. !ticket close
        if (sub === 'close') {
            const { closeTicketChannel } = require('../../events/interactionCreate');
            // Mock interaction-like object for channel operations if in ticket channel
            if (!message.channel.name || !message.channel.name.startsWith('ticket-')) {
                return message.reply('❌ ניתן להשתמש בפקודה זו רק בתוך ערוץ טיקט פעיל!');
            }
            const fakeInteraction = {
                channel: message.channel,
                guild: message.guild,
                user: message.author,
                reply: async (opts) => message.channel.send(typeof opts === 'string' ? opts : opts.content || { embeds: opts.embeds })
            };
            return closeTicketChannel(fakeInteraction);
        }

        // Default help for !ticket
        const helpEmbed = createEmbed({
            title: `🎫 ניהול טיקטים - ${message.guild.name}`,
            description: 'להלן אפשרויות הפקודה `!ticket` / `/ticket`:\n\n' +
                         '• `!ticket panel` — שליחת פאנל יצירת טיקטים לערוץ הנוכחי\n' +
                         '• `!ticket set message <הודעה>` — הגדרת הודעת פתיחה מותאמת אישית לטיקט\n' +
                         '• `!ticket reset-message` — איפוס הודעת הטיקט לברירת המחדל\n' +
                         '• `!ticket close` — סגירת ערוץ הטיקט הנוכחי והפקת תמליל שיחה',
            color: COLORS.PRIMARY,
            footerText: `${message.guild.name} • מערכת טיקטים`
        });

        return message.reply({ embeds: [helpEmbed] });
    }
};
