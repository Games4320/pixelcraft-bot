const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');
const { createEmbed, createSuccessEmbed, COLORS } = require('../../utils/embedBuilder');
const { updateGuildConfig } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('ניהול פניות וטיקטים בשרת')
        .addSubcommand(subcommand =>
            subcommand.setName('panel')
                .setDescription('שליחת פאנל יצירת טיקטים לערוץ (למנהלים בלבד)')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('setup')
                .setDescription('הגדרת ושליחת פאנל יצירת טיקטים לערוץ (למנהלים בלבד)')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('close')
                .setDescription('סגירת ערוץ הטיקט הנוכחי')
        )
        .addSubcommandGroup(group =>
            group.setName('set')
                .setDescription('הגדרות מתקדמות למערכת הטיקטים')
                .addSubcommand(subcommand =>
                    subcommand.setName('message')
                        .setDescription('הגדרת הודעת פתיחה מותאמת אישית בעת פתיחת טיקט')
                        .addStringOption(option =>
                            option.setName('message')
                                .setDescription('תוכן ההודעה שתוצג בטיקט (משתנים: {user}, {username}, {server}, {category})')
                                .setRequired(true)
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('reset-message')
                .setDescription('איפוס הודעת פתיחת הטיקט להודעת ברירת המחדל')
        ),
    async execute(interaction) {
        const group = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'panel' || subcommand === 'setup') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ דרושות הרשאות ניהול שרת כדי לשלוח את פאנל הטיקטים.', ephemeral: true });
            }

            const embed = createEmbed({
                title: `🎫 מרכז תמיכה וטיקטים - ${interaction.guild.name}`,
                description: `זקוק לעזרה או מעוניין לדווח על בעיה בשרת **${interaction.guild.name}**?\n\n` +
                             `בחר קטגוריה מהתפריט למטה כדי לפתוח ערוץ תמיכה פרטי עם צוות השרת.`,
                color: COLORS.PRIMARY,
                fields: [
                    { name: '🛠️ תמיכה', value: 'עזרה כללית, שאלות על המשחק או הבוט.', inline: true },
                    { name: '🚨 דיווח', value: 'דיווח על שחקן, הפרת חוקים או תקלה.', inline: true },
                    { name: '📝 בחינה לצוות', value: 'הגשת מועמדות ובחינה להצטרפות לצוות.', inline: true },
                    { name: '❓ אחר', value: 'פניות שונות, הצעות או נושאים אחרים.', inline: true }
                ],
                footerText: `${interaction.guild.name} • לחץ למטה לבחירת קטגוריה`
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

            await interaction.reply({ embeds: [embed], components: [row] });
        } else if (group === 'set' && subcommand === 'message') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ דרושות הרשאות ניהול שרת כדי להגדיר את הודעת הטיקטים.', ephemeral: true });
            }

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
        } else if (subcommand === 'reset-message') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ דרושות הרשאות ניהול שרת כדי לאפס את הודעת הטיקטים.', ephemeral: true });
            }

            updateGuildConfig(interaction.guildId, 'ticketMessage', null);

            const embed = createSuccessEmbed(
                'הודעת הטיקט אופסה לברירת המחדל',
                `הודעת פתיחת הטיקט בשרת **${interaction.guild.name}** אופסה לתבניות ברירת המחדל לפי קטגוריה בהצלחה.`
            );

            await interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'close') {
            const { closeTicketChannel } = require('../../events/interactionCreate');
            await closeTicketChannel(interaction);
        }
    }
};
