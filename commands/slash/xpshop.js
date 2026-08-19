const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    RoleSelectMenuBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { getGuildConfig, updateGuildConfig, getUserProfile, deductXP } = require('../../utils/database');
const { createEmbed, createErrorEmbed, createSuccessEmbed, COLORS } = require('../../utils/embedBuilder');

const activeSetupSessions = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xpshop')
        .setDescription('צפייה, מימוש תפקידים ב-XP או ניהול חנות התפקידים')
        .addSubcommand(subcommand =>
            subcommand.setName('view')
                .setDescription('צפייה בחנות התפקידים ומימוש תפקידים באמצעות XP')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('הוספת תפקיד לחנות ה-XP (עד 20 תפקידים)')
                .addRoleOption(opt =>
                    opt.setName('role')
                        .setDescription('התפקיד שיימכר בחנות')
                        .setRequired(true)
                )
                .addIntegerOption(opt =>
                    opt.setName('xp_cost')
                        .setDescription('מחיר ה-XP הנדרש לרכישת התפקיד')
                        .setMinValue(1)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setDescription('הסרת תפקיד מחנות ה-XP')
                .addRoleOption(opt =>
                    opt.setName('role')
                        .setDescription('התפקיד להסרה מהחנות')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('clear')
                .setDescription('איפוס וניקוי כל התפקידים מחנות ה-XP')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('setup')
                .setDescription('אשף הגדרת חנות התפקידים בשרת (למנהלים בלבד)')
        ),
    activeSetupSessions,

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ embeds: [createErrorEmbed('דרושות הרשאות **ניהול שרת** כדי לערוך את חנות ה-XP!')], ephemeral: true });
            }

            const role = interaction.options.getRole('role');
            const xpCost = interaction.options.getInteger('xp_cost');
            const config = getGuildConfig(interaction.guildId);
            const shop = config.xpshop || [];

            if (shop.length >= 20) {
                return interaction.reply({
                    embeds: [createErrorEmbed('הגעת למגבלה המקסימלית של 20 תפקידים בחנות ה-XP!')],
                    ephemeral: true
                });
            }

            const existingIndex = shop.findIndex(item => item.roleId === role.id);
            if (existingIndex !== -1) {
                shop[existingIndex].xpCost = xpCost;
            } else {
                shop.push({ roleId: role.id, xpCost });
            }

            updateGuildConfig(interaction.guildId, 'xpshop', shop);

            const embed = createSuccessEmbed(
                'תפקיד נוסף לחנות ה-XP',
                `התפקיד **${role}** נוסף בהצלחה לחנות במחיר של **${xpCost} XP**!\nסה"כ תפקידים בחנות: **${shop.length}/20**`
            );
            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'remove') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ embeds: [createErrorEmbed('דרושות הרשאות **ניהול שרת** כדי לערוך את חנות ה-XP!')], ephemeral: true });
            }

            const role = interaction.options.getRole('role');
            const config = getGuildConfig(interaction.guildId);
            let shop = config.xpshop || [];

            const initialLength = shop.length;
            shop = shop.filter(item => item.roleId !== role.id);

            if (shop.length === initialLength) {
                return interaction.reply({ embeds: [createErrorEmbed(`התפקיד **${role.name}** אינו נמצא בחנות ה-XP.`)], ephemeral: true });
            }

            updateGuildConfig(interaction.guildId, 'xpshop', shop);
            return interaction.reply({ embeds: [createSuccessEmbed('תפקיד הוסר מחנות ה-XP', `התפקיד **${role.name}** הוסר בהצלחה מהחנות.`)] });
        }

        if (subcommand === 'clear') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ embeds: [createErrorEmbed('דרושות הרשאות **ניהול שרת** כדי לאפס את חנות ה-XP!')], ephemeral: true });
            }

            updateGuildConfig(interaction.guildId, 'xpshop', []);
            return interaction.reply({ embeds: [createSuccessEmbed('חנות ה-XP אופסה', 'כל התפקידים הוסרו מחנות ה-XP בהצלחה.')] });
        }

        if (subcommand === 'setup') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({
                    embeds: [createErrorEmbed('דרושות הרשאות **ניהול שרת** כדי להגדיר את חנות ה-XP!')],
                    ephemeral: true
                });
            }

            const modal = new ModalBuilder()
                .setCustomId('xpshop_modal_count')
                .setTitle('הגדרת חנות XP - מספר תפקידים');

            const countInput = new TextInputBuilder()
                .setCustomId('xpshop_role_count')
                .setLabel('כמה תפקידים להגדיר כעת באשף? (1-5)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('הזן מספר בין 1 ל-5 (ניתן להוסיף עד 20 עם /xpshop add)')
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(1);

            const row = new ActionRowBuilder().addComponents(countInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        } else {
            await handleShopView(interaction);
        }
    }
};

async function handleShopView(interaction) {
    const config = getGuildConfig(interaction.guildId);
    const shop = config.xpshop || [];

    if (shop.length === 0) {
        const embed = createEmbed({
            title: '🛒 חנות תפקידי XP',
            description: 'חנות התפקידים עדיין לא הוגדרה בשרת זה.\nמנהלים יכולים להגדיר אותה באמצעות הפקודה `/xpshop setup`.',
            color: COLORS.WARNING
        });
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const userProfile = getUserProfile(interaction.guildId, interaction.user.id);
    const userXP = userProfile.xp || 0;

    let shopDescription = `ה-XP הנוכחי שלך: **${userXP} XP** (רמה ${userProfile.level || Math.floor(userXP / 150)})\n\n`;
    shopDescription += 'בחר תפקיד מהתפריט למטה כדי לממש אותו באמצעות ה-XP שלך:\n\n';

    const selectOptions = [];

    for (let i = 0; i < shop.length; i++) {
        const item = shop[i];
        const role = interaction.guild.roles.cache.get(item.roleId);
        const roleName = role ? role.name : 'תפקיד לא ידוע';
        const hasRole = interaction.member.roles.cache.has(item.roleId);

        const statusSymbol = hasRole ? '✅ בבעלותך' : (userXP >= item.xpCost ? '🔓 זמין לרכישה' : '🔒 נעול');
        shopDescription += `**${i + 1}. ${roleName}** — **${item.xpCost} XP** [${statusSymbol}]\n`;

        selectOptions.push(
            new StringSelectMenuOptionBuilder()
                .setLabel(`${roleName} (${item.xpCost} XP)`)
                .setValue(item.roleId)
                .setDescription(hasRole ? 'כבר בבעלותך' : `מחיר: ${item.xpCost} XP (ה-XP שלך: ${userXP})`)
                .setEmoji(hasRole ? '✅' : (userXP >= item.xpCost ? '🎉' : '🔒'))
        );
    }

    const embed = createEmbed({
        title: '🛒 חנות תפקידי XP',
        description: shopDescription,
        color: COLORS.PRIMARY,
        thumbnail: interaction.guild.iconURL({ dynamic: true })
    });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('xpshop_redeem_select')
        .setPlaceholder('🛒 בחר תפקיד למימוש...')
        .addOptions(selectOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({ embeds: [embed], components: [row] });
}
