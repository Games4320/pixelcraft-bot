const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { createEmbed, createSuccessEmbed, COLORS } = require('../../utils/embedBuilder');
const { getGuildConfig, updateGuildConfig } = require('../../utils/database');

// מפה לשמירת סשנים פעילים של הגדרת נושאים לכל שרת
const activeSubjectSetupSessions = new Map();

module.exports = {
    activeSubjectSetupSessions, // ייצוא המפה לשימוש ב-interactionCreate.js
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
            subcommand.setName('subjects')
                .setDescription('הגדרת נושאים/קטגוריות מותאמים אישית לטיקטים בשרת')
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('מספר הנושאים שברצונך להגדיר (בין 1 ל-5)')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(5)
                )
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

        // -------------------------------------------------------------
        // פאנל / SETUP: הצגת פאנל הטיקטים בשרת
        // -------------------------------------------------------------
        if (subcommand === 'panel' || subcommand === 'setup') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ דרושות הרשאות ניהול שרת כדי לשלוח את פאנל הטיקטים.', ephemeral: true });
            }

            const config = getGuildConfig(interaction.guildId);
            const customSubjects = config.ticketSubjects;

            let embedFields = [];
            let selectOptions = [];
            let embedDescription = `זקוק לעזרה או מעוניין לדווח על בעיה בשרת **${interaction.guild.name}**?\n\n` +
                                   `בחר קטגוריה מהתפריט למטה כדי לפתוח ערוץ תמיכה פרטי עם צוות השרת.`;

            if (Array.isArray(customSubjects) && customSubjects.length > 0) {
                // בנית הקטגוריות הדינמיות שהוגדרו על ידי המנהל
                for (const sub of customSubjects) {
                    embedFields.push({
                        name: `${sub.emoji ? sub.emoji + ' ' : ''}${sub.name}`,
                        value: sub.description,
                        inline: true
                    });
                    selectOptions.push(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(sub.name)
                            .setValue(sub.value)
                            .setDescription(sub.description.substring(0, 100))
                            .setEmoji(sub.emoji || '🎫')
                    );
                }
            } else {
                // ברירת מחדל במידה ולא הוגדרו נושאים אישיים
                embedFields = [
                    { name: '🛠️ תמיכה', value: 'עזרה כללית, שאלות על המשחק או הבוט.', inline: true },
                    { name: '🚨 דיווח', value: 'דיווח על שחקן, הפרת חוקים או תקלה.', inline: true },
                    { name: '📝 בחינה לצוות', value: 'הגשת מועמדות ובחינה להצטרפות לצוות.', inline: true },
                    { name: '❓ אחר', value: 'פניות שונות, הצעות או נושאים אחרים.', inline: true }
                ];
                selectOptions = [
                    new StringSelectMenuOptionBuilder().setLabel('תמיכה').setValue('support').setDescription('תמיכה כללית או עזרה במשחק').setEmoji('🛠️'),
                    new StringSelectMenuOptionBuilder().setLabel('דיווח').setValue('report').setDescription('דיווח על שחקן או הפרת חוקים').setEmoji('🚨'),
                    new StringSelectMenuOptionBuilder().setLabel('בחינה לצוות').setValue('staff_app').setDescription('הגשת מועמדות והצטרפות לצוות השרת').setEmoji('📝'),
                    new StringSelectMenuOptionBuilder().setLabel('אחר').setValue('other').setDescription('פניות אחרות או הצעות').setEmoji('❓')
                ];
            }

            const embed = createEmbed({
                title: `🎫 מרכז תמיכה וטיקטים - ${interaction.guild.name}`,
                description: embedDescription,
                color: COLORS.PRIMARY,
                fields: embedFields,
                footerText: `${interaction.guild.name} • לחץ למטה לבחירת קטגוריה`
            });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_create_menu')
                .setPlaceholder('📩 בחר קטגוריה לפתיחת טיקט...')
                .addOptions(selectOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({ embeds: [embed], components: [row] });

        // -------------------------------------------------------------
        // SUBJECTS: אשף הגדרת נושאים מותאמים אישית
        // -------------------------------------------------------------
        } else if (subcommand === 'subjects') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ דרושות הרשאות ניהול שרת כדי להגדיר נושאים לטיקטים.', ephemeral: true });
            }

            const amount = interaction.options.getInteger('amount');

            // פתיחת סשן חדש במפה
            activeSubjectSetupSessions.set(interaction.guildId, {
                amount,
                currentStep: 1,
                subjects: []
            });

            const embed = createEmbed({
                title: '🎫 אשף הגדרת נושאי טיקטים',
                description: `התחלת בתהליך הגדרת **${amount}** נושאי טיקטים מותאמים אישית עבור השרת שלך.\n\n` +
                             `לחץ על הכפתור למטה כדי להגדיר את **נושא #1** (שם, תיאור ואימוג'י).`,
                color: COLORS.PRIMARY
            });

            const startBtn = new ButtonBuilder()
                .setCustomId('ticket_subject_btn_1')
                .setLabel('התחל הגדרה - נושא #1 ⚙️')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder().addComponents(startBtn);

            return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        // -------------------------------------------------------------
        // SET MESSAGE: הגדרת הודעת פתיחה
        // -------------------------------------------------------------
        } else if (group === 'set' && subcommand === 'message') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ דרושות הרשאות ניהול שרת כדי להגדיר את הודעת הטיקטים.', ephemeral: true });
            }

            const customMessage = interaction.options.getString('message');
            updateGuildConfig(interaction.guildId, 'ticketMessage', customMessage);

            const embed = createSuccessEmbed(
                'הודעת פתיחת טיקט עודכנה בהצלחה',
                `הודעת הפתיחה שתוצג למשתמשים בעת פתיחת טיקט חדש עודכנה!\n\n` +
                `**ההודעה החדשה:**\n${customMessage}`
            );

            await interaction.reply({ embeds: [embed] });

        // -------------------------------------------------------------
        // RESET MESSAGE: איפוס הודעה
        // -------------------------------------------------------------
        } else if (subcommand === 'reset-message') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ דרושות הרשאות ניהול שרת כדי לאפס את הודעת הטיקטים.', ephemeral: true });
            }

            updateGuildConfig(interaction.guildId, 'ticketMessage', null);

            const embed = createSuccessEmbed(
                'הודעת הטיקט אופסה לברירת המחדל',
                `הודעת פתיחת הטיקט בשרת **${interaction.guild.name}** אופסה לתבנית ברירת המחדל.`
            );

            await interaction.reply({ embeds: [embed] });

        // -------------------------------------------------------------
        // CLOSE: סגירת טיקט
        // -------------------------------------------------------------
        } else if (subcommand === 'close') {
            const { closeTicketChannel } = require('../../events/interactionCreate');
            await closeTicketChannel(interaction);
        }
    }
};