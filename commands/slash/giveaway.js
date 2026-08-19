const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { startGiveaway, rerollGiveaway, endGiveaway } = require('../../utils/giveawayManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('מערכת הגרלות מתקדמת')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand.setName('create')
                .setDescription('יצירת הגרלה חדשה')
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('משך זמן ההגרלה (לדוגמה: 10s, 10m, 2h, 1d)')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('winners')
                        .setDescription('מספר הזוכים בהגרלה (לדוגמה: 1, 2)')
                        .setMinValue(1)
                        .setMaxValue(20)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('prize')
                        .setDescription('הפרס בהגרלה (לדוגמה: 1000XP, ניטרו, תפקיד)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('reroll')
                .setDescription('בחירת זוכה חדש להגרלה שהסתיימה')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('מזהה ההודעה של ההגרלה (Message ID)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('end')
                .setDescription('סיום הגרלה פעילה באופן מיידי')
                .addStringOption(option =>
                    option.setName('message_id')
                        .setDescription('מזהה ההודעה של ההגרלה (Message ID)')
                        .setRequired(true)
                )
        ),
    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                content: '❌ דרושות הרשאות ניהול שרת כדי לנהל הגרלות.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const timeStr = interaction.options.getString('time');
            const winnerCount = interaction.options.getInteger('winners');
            const prize = interaction.options.getString('prize');

            await startGiveaway(client, interaction, { timeStr, winnerCount, prize });
        } else if (subcommand === 'reroll') {
            const messageId = interaction.options.getString('message_id').trim();
            await rerollGiveaway(interaction, messageId);
        } else if (subcommand === 'end') {
            const messageId = interaction.options.getString('message_id').trim();
            await endGiveaway(client, messageId);
            await interaction.reply({ content: `✅ ההגרלה (${messageId}) הסתיימה בהצלחה.`, ephemeral: true });
        }
    }
};
