const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder
} = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embedBuilder');

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
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'panel' || subcommand === 'setup') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ דרושות הרשאות ניהול שרת כדי לשלוח את פאנל הטיקטים.', ephemeral: true });
            }

            const embed = createEmbed({
                title: '🎫 מרכז תמיכה וטיקטים',
                description: 'זקוק לעזרה או מעוניין לדווח על בעיה?\n\n' +
                             'בחר קטגוריה מהתפריט למטה כדי לפתוח ערוץ תמיכה פרטי עם צוות השרת.',
                color: COLORS.PRIMARY,
                fields: [
                    { name: '🛠️ תמיכה', value: 'עזרה כללית, שאלות על המשחק או הבוט.', inline: true },
                    { name: '🚨 דיווח', value: 'דיווח על שחקן, הפרת חוקים או תקלה.', inline: true },
                    { name: '❓ אחר', value: 'פניות שונות, הצעות או נושאים אחרים.', inline: true }
                ],
                footerText: 'מערכת טיקטים • לחץ למטה לבחירת קטגוריה'
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
                        .setLabel('אחר')
                        .setValue('other')
                        .setDescription('פניות אחרות או הצעות')
                        .setEmoji('❓')
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({ embeds: [embed], components: [row] });
        } else if (subcommand === 'close') {
            const { closeTicketChannel } = require('../../events/interactionCreate');
            await closeTicketChannel(interaction);
        }
    }
};
