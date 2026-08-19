const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, updateGuildConfig } = require('../../utils/database');
const { createEmbed, createSuccessEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('veteran')
        .setDescription('הגדרות מעמד ותפקיד וותיק (Veteran / OG) בשרת')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommandGroup(group =>
            group.setName('set')
                .setDescription('הגדרות מעמד וותיק')
                .addSubcommand(sub =>
                    sub.setName('role')
                        .setDescription('הגדרת התפקיד שיינתן לחברי שרת וותיקים (לדוגמה: Veteran, OG, Gold, Diamond)')
                        .addRoleOption(opt =>
                            opt.setName('role')
                                .setDescription('התפקיד שיוענק כמעמד וותיק')
                                .setRequired(true)
                        )
                )
        )
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('הצגת התפקיד וההגדרות הנוכחיות למעמד וותיק')
        )
        .addSubcommand(sub =>
            sub.setName('reset')
                .setDescription('איפוס הגדרת תפקיד הוותיק')
        ),
    async execute(interaction) {
        const group = interaction.options.getSubcommandGroup(false);
        const sub = interaction.options.getSubcommand();

        if (group === 'set' && sub === 'role') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ דרושות הרשאות ניהול שרת כדי להגדיר את תפקיד הוותיק.', ephemeral: true });
            }

            const role = interaction.options.getRole('role');
            updateGuildConfig(interaction.guildId, 'veteranRoleId', role.id);

            const embed = createSuccessEmbed(
                'תפקיד וותיק עודכן בהצלחה',
                `תפקיד הוותיק עבור **${interaction.guild.name}** הוגדר לתפקיד **${role}**!\n\n` +
                `מעתה, פקודת \`!vt\` תותאם לשם התפקיד **${role.name}** ותעניק אותו אוטומטית לשחקנים זכאים (6+ חודשים בשרת).`
            );

            return interaction.reply({ embeds: [embed] });
        } else if (sub === 'reset') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ דרושות הרשאות ניהול שרת כדי לאפס את תפקיד הוותיק.', ephemeral: true });
            }

            updateGuildConfig(interaction.guildId, 'veteranRoleId', null);
            return interaction.reply({ embeds: [createSuccessEmbed('הגדרת תפקיד וותיק אופסה', 'מעמד הוותיק יחפש מעתה תפקיד ברירת מחדל בשם "VETERAN" / "וותיק".')] });
        }

        // View settings
        const config = getGuildConfig(interaction.guildId);
        const role = config.veteranRoleId ? interaction.guild.roles.cache.get(config.veteranRoleId) : null;
        const roleName = role ? `${role} (${role.name})` : 'ברירת מחדל (חיפוש אוטומטי של "VETERAN" / "וותיק")';

        const embed = createEmbed({
            title: `🎖️ הגדרות מעמד וותיק - ${interaction.guild.name}`,
            description: `להלן הגדרות מעמד הוותיק בשרת **${interaction.guild.name}**:`,
            color: COLORS.PRIMARY,
            fields: [
                { name: '🎖️ תפקיד מוגדר:', value: roleName, inline: false },
                { name: '⏱️ זמן נדרש בשרת:', value: '6 חודשים (180 ימים)', inline: false },
                { name: '💡 כיצד לשנות תפקיד:', value: 'הרץ את הפקודה `/veteran set role role:<תפקיד>`', inline: false }
            ],
            footerText: `${interaction.guild.name} Bot • מערכת וותיקים`
        });

        return interaction.reply({ embeds: [embed] });
    }
};
