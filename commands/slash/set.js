const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateGuildConfig } = require('../../utils/database');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set')
        .setDescription('הגדרות שרת כלליות')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand.setName('afkroom')
                .setDescription('הגדרת חדר שיחה קולי כחדר AFK (שבו לא מקבלים Voice XP)')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('ערוץ השיחה הקולי של ה-AFK')
                        .addChannelTypes(ChannelType.GuildVoice)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('clear-afkroom')
                .setDescription('איפוס והסרת הגדרת חדר ה-AFK')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('autorole')
                .setDescription('הגדרת רול אוטומטי שיחולק לכל משתמש חדש שמצטרף לשרת')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('התפקיד שיוענק אוטומטית למצטרפים חדשים')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('clear-autorole')
                .setDescription('ביטול והסרת מנגנון הרול האוטומטי')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('logsroom')
                .setDescription('הגדרת ערוץ הלוגים המרכזי שבו ישלחו כל לוגי השרת (מחיקות, עריכות, כניסות, שיחות)')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('ערוץ הטקסט שיהפוך לחדר לוגים')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('clear-logsroom')
                .setDescription('ביטול והסרת ערוץ הלוגים')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('lockrole')
                .setDescription('הגדרת התפקיד הזמני שאליו מורדים כל אנשי הצוות בעת נעילת חירום (/lockserver)')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('התפקיד הנחות/הבטוח שיוענק לצוות בזמן נעילת חירום')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('clear-lockrole')
                .setDescription('ביטול והסרת הגדרת רול הנעילה')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('levelingroom')
                .setDescription('הגדרת ערוץ ייעודי להודעות עליית רמה (Level Up) למניעת הצפה בצ\'אט')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('ערוץ הטקסט שבו ישלחו הודעות עליית רמה')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('clear-levelingroom')
                .setDescription('ביטול והסרת ערוץ הודעות עליית הרמה (ההודעות ישלחו בערוץ שבו התרחשה עליית הרמה)')
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                embeds: [createErrorEmbed('דרושות הרשאות **ניהול שרת** כדי לשנות הגדרות אלו!')],
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'afkroom') {
            const channel = interaction.options.getChannel('channel');
            updateGuildConfig(interaction.guildId, 'afkVoiceChannelId', channel.id);

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'חדר AFK הוגדר בהצלחה',
                    `הערוץ הקולי ${channel} הוגדר כעת כ**חדר AFK** של השרת! 💤\nמשתמשים הנמצאים בערוץ זה לא יצברו נקודות Voice XP.`
                )]
            });
        } else if (subcommand === 'clear-afkroom') {
            updateGuildConfig(interaction.guildId, 'afkVoiceChannelId', null);

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'חדר AFK הוסר',
                    'הגדרת חדר ה-AFK בוטלה בהצלחה.'
                )]
            });
        } else if (subcommand === 'autorole') {
            const role = interaction.options.getRole('role');
            updateGuildConfig(interaction.guildId, 'autoRoleId', role.id);

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'רול אוטומטי (Auto-Role) הוגדר בהצלחה',
                    `התפקיד ${role} יוענק מעתה באופן אוטומטי לכל משתמש חדש שמצטרף לשרת! 🎭`
                )]
            });
        } else if (subcommand === 'clear-autorole') {
            updateGuildConfig(interaction.guildId, 'autoRoleId', null);

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'רול אוטומטי בוטל',
                    'הגדרת הרול האוטומטי בוטלה בהצלחה.'
                )]
            });
        } else if (subcommand === 'logsroom') {
            const channel = interaction.options.getChannel('channel');
            updateGuildConfig(interaction.guildId, 'logsChannelId', channel.id);

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'חדר לוגים הוגדר בהצלחה 📝',
                    `הערוץ ${channel} הוגדר כעת כ**חדר הלוגים המרכזי** של השרת!\nכל הלוגים (מחיקות, עריכות, כניסות, עזיבות, שיחות ו-AutoMod) ישלחו לערוץ זה.`
                )]
            });
        } else if (subcommand === 'clear-logsroom') {
            updateGuildConfig(interaction.guildId, 'logsChannelId', null);

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'חדר לוגים הוסר',
                    'הגדרת חדר הלוגים בוטלה בהצלחה.'
                )]
            });
        } else if (subcommand === 'lockrole') {
            const role = interaction.options.getRole('role');
            updateGuildConfig(interaction.guildId, 'lockdownRoleId', role.id);

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'רול נעילת חירום הוגדר בהצלחה 🛡️',
                    `התפקיד ${role} הוגדר כתפקיד הנעילה של השרת!\n` +
                    `בעת הפעלת פקודת הנעילה \`/lockserver\`, כל אנשי הצוות בעלי הגישות (למעט הבעלים) יורדו לתפקיד זה וגישותיהם יינעלו.`
                )]
            });
        } else if (subcommand === 'clear-lockrole') {
            updateGuildConfig(interaction.guildId, 'lockdownRoleId', null);

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'רול נעילת חירום בוטל',
                    'הגדרת רול הנעילה בוטלה בהצלחה.'
                )]
            });
        } else if (subcommand === 'levelingroom') {
            const channel = interaction.options.getChannel('channel');
            updateGuildConfig(interaction.guildId, 'levelingChannelId', channel.id);

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'חדר הודעות עליית רמה הוגדר בהצלחה ⭐',
                    `הערוץ ${channel} הוגדר כעת כ**חדר הודעות עליית הרמה** של השרת!\nכל הודעות ה-Level Up ישלחו מעתה אך ורק לערוץ זה למניעת הצפה בצ'אט הראשי.`
                )]
            });
        } else if (subcommand === 'clear-levelingroom') {
            updateGuildConfig(interaction.guildId, 'levelingChannelId', null);

            return interaction.reply({
                embeds: [createSuccessEmbed(
                    'חדר הודעות עליית רמה הוסר',
                    'הגדרת חדר הודעות עליית הרמה בוטלה בהצלחה. הודעות Level Up ישלחו שוב בערוץ שבו התרחשה עליית הרמה.'
                )]
            });
        }
    }
};