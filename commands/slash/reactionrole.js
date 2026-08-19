const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embedBuilder');

function buildRoleOptions(subcommand) {
    return subcommand
        .addStringOption(opt =>
            opt.setName('title')
                .setDescription('כותרת הפאנל (לדוגמה: 🎭 בחירת תפקידים והתראות)')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('description')
                .setDescription('הסבר שיופיע בפאנל')
                .setRequired(true)
        )
        .addRoleOption(opt =>
            opt.setName('role1')
                .setDescription('תפקיד ראשון')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('label1')
                .setDescription('שם הכפתור לתפקיד הראשון')
                .setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('emoji1')
                .setDescription('אימוג\'י לכפתור הראשון (אופציונלי)')
                .setRequired(false)
        )
        .addRoleOption(opt =>
            opt.setName('role2')
                .setDescription('תפקיד שני')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('label2')
                .setDescription('שם הכפתור לתפקיד השני')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('emoji2')
                .setDescription('אימוג\'י לכפתור השני (אופציונלי)')
                .setRequired(false)
        )
        .addRoleOption(opt =>
            opt.setName('role3')
                .setDescription('תפקיד שלישי')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('label3')
                .setDescription('שם הכפתור לתפקיד השלישי')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('emoji3')
                .setDescription('אימוג\'י לכפתור השלישי (אופציונלי)')
                .setRequired(false)
        )
        .addRoleOption(opt =>
            opt.setName('role4')
                .setDescription('תפקיד רביעי')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('label4')
                .setDescription('שם הכפתור לתפקיד הרביעי')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('emoji4')
                .setDescription('אימוג\'י לכפתור הרביעי (אופציונלי)')
                .setRequired(false)
        )
        .addRoleOption(opt =>
            opt.setName('role5')
                .setDescription('תפקיד חמישי')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('label5')
                .setDescription('שם הכפתור לתפקיד החמישי')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt.setName('emoji5')
                .setDescription('אימוג\'י לכפתור החמישי (אופציונלי)')
                .setRequired(false)
        );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('יצירת פאנל בחירת תפקידים בלחיצה (Reaction Roles)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(sub => buildRoleOptions(sub.setName('panel').setDescription('שליחת פאנל בחירת תפקידים עם כפתורים')))
        .addSubcommand(sub => buildRoleOptions(sub.setName('create').setDescription('יצירת פאנל בחירת תפקידים עם כפתורים'))),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({
                content: '❌ דרושות הרשאות **ניהול תפקידים (Manage Roles)** כדי ליצור פאנל תפקידים.',
                ephemeral: true
            });
        }

        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');

        const buttons = [];
        const roleListLines = [];

        for (let i = 1; i <= 5; i++) {
            const role = interaction.options.getRole(`role${i}`);
            const label = interaction.options.getString(`label${i}`);
            const emoji = interaction.options.getString(`emoji${i}`);

            if (role && label) {
                const btn = new ButtonBuilder()
                    .setCustomId(`reactionrole_btn_${role.id}`)
                    .setLabel(label)
                    .setStyle(ButtonStyle.Secondary);

                if (emoji) {
                    try {
                        btn.setEmoji(emoji.trim());
                    } catch (e) {}
                }

                buttons.push(btn);
                roleListLines.push(`• ${emoji ? `${emoji} ` : ''}**${label}** ➔ <@&${role.id}>`);
            }
        }

        if (buttons.length === 0) {
            return interaction.reply({ content: '❌ אנא הגדר לפחות תפקיד אחד וכפתור.', ephemeral: true });
        }

        const embed = createEmbed({
            title: `🎭 ${title}`,
            description: `${description}\n\n**תפקידים זמינים לבחירה:**\n${roleListLines.join('\n')}\n\n*לחצו על הכפתורים למטה כדי לקבל או להסיר את התפקיד!*`,
            color: COLORS.PRIMARY,
            footerText: `${interaction.guild.name} Bot • בחירת תפקידים`
        });

        const row = new ActionRowBuilder().addComponents(buttons);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ פאנל בחירת התפקידים נשלח בהצלחה לערוץ!', ephemeral: true });
    }
};
