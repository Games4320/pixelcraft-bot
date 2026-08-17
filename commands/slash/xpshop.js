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
const { getGuildConfig, getUserProfile, deductXP } = require('../../utils/database');
const { createEmbed, createErrorEmbed, createSuccessEmbed, COLORS } = require('../../utils/embedBuilder');

const activeSetupSessions = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xpshop')
        .setDescription('צפייה, מימוש תפקידים ב-XP או הגדרת חנות התפקידים')
        .addSubcommand(subcommand =>
            subcommand.setName('view')
                .setDescription('צפייה בחנות התפקידים ומימוש תפקידים באמצעות XP')
        )
        .addSubcommand(subcommand =>
            subcommand.setName('setup')
                .setDescription('הגדרת חנות התפקידים בשרת (למנהלים בלבד)')
        ),
    activeSetupSessions,

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

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
                .setLabel('כמה תפקידים יהיו בחנות זו? (1-5)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('הזן מספר בין 1 ל-5')
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
