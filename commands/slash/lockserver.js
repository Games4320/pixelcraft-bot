const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
} = require("discord.js");
const { getGuildConfig, updateGuildConfig } = require("../../utils/database");
const {
  createEmbed,
  createErrorEmbed,
  createSuccessEmbed,
  COLORS,
} = require("../../utils/embedBuilder");

const ELEVATED_PERMS = [
  PermissionsBitField.Flags.Administrator,
  PermissionsBitField.Flags.ManageGuild,
  PermissionsBitField.Flags.ManageRoles,
  PermissionsBitField.Flags.ManageChannels,
  PermissionsBitField.Flags.BanMembers,
  PermissionsBitField.Flags.KickMembers,
  PermissionsBitField.Flags.ManageMessages,
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lockserver")
    .setDescription(
      "🚨 נעילת חירום מוחלטת של השרת, נעילת כל הערוצים והורדת דרגות צוות (למעט הבעלים)",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    // Ensure only Server Owner or Administrators can trigger lockdown
    const isOwner = interaction.user.id === guild.ownerId;
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isOwner && !isAdmin) {
      return interaction.reply({
        embeds: [
          createErrorEmbed(
            "רק בעלי השרת או מנהלים ראשיים יכולים להפעיל נעילת חירום!",
          ),
        ],
        ephemeral: true,
      });
    }

    const config = getGuildConfig(guild.id);
    if (config.lockdownData) {
      return interaction.reply({
        embeds: [
          createErrorEmbed(
            "השרת כבר נמצא במצב נעילת חירום! כדי לבטל את הנעילה השתמש ב-`/unlockserver`.",
          ),
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    // 1. Lock all text channels (@everyone SendMessages: false)
    const lockedChannelIds = [];
    for (const channel of guild.channels.cache.values()) {
      if (channel.isTextBased() && !channel.isThread()) {
        try {
          await channel.permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: false,
            AddReactions: false,
          });
          lockedChannelIds.push(channel.id);
        } catch (err) {}
      }
    }

    // 2. Demote Staff with permissions (except Owner and Bots)
    const fallbackRole = config.lockdownRoleId
      ? guild.roles.cache.get(config.lockdownRoleId)
      : null;
    const savedStaff = [];

    try {
      await guild.members.fetch();
    } catch (e) {}

    for (const targetMember of guild.members.cache.values()) {
      if (targetMember.user.bot) continue;
      if (targetMember.id === guild.ownerId) continue; // NEVER touch the Owner

      // Check if member has dangerous staff roles
      const hasElevated = ELEVATED_PERMS.some((perm) =>
        targetMember.permissions.has(perm),
      );
      if (hasElevated) {
        const currentRoles = targetMember.roles.cache
          .filter((r) => r.id !== guild.id)
          .map((r) => r.id);
        savedStaff.push({
          userId: targetMember.id,
          roles: currentRoles,
        });

        try {
          // Strip staff roles and assign fallback role if configured
          if (fallbackRole) {
            await targetMember.roles.set([fallbackRole.id]).catch(() => {});
          } else {
            // Filter out roles with elevated permissions
            const safeRoles = targetMember.roles.cache
              .filter((r) => {
                if (r.id === guild.id) return false;
                return !ELEVATED_PERMS.some((perm) => r.permissions.has(perm));
              })
              .map((r) => r.id);
            await targetMember.roles.set(safeRoles).catch(() => {});
          }
        } catch (err) {
          console.error(
            `Failed to modify roles for staff ${targetMember.user.tag}:`,
            err.message,
          );
        }
      }
    }

    // Save lockdown state
    const lockdownData = {
      lockedAt: Date.now(),
      lockedBy: interaction.user.id,
      lockedChannelIds,
      savedStaff,
    };
    updateGuildConfig(guild.id, "lockdownData", lockdownData);

    const embed = createEmbed({
      title: "🚨 השרת ננעל במצב חירום! (LOCKDOWN)",
      description:
        `השרת **${guild.name}** ננעל כעת לחלוטין לצורך הגנה.\n\n` +
        `🔒 **ערוצים שננעלו:** \`${lockedChannelIds.length}\` ערוצים\n` +
        `👥 **אנשי צוות שהורדו בדרגה:** \`${savedStaff.length}\` משתמשים\n` +
        `👑 **בעלי השרת:** לא הושפע (${await guild.fetchOwner()})\n` +
        `🛡️ **רול נעילה הוחל:** ${fallbackRole ? fallbackRole : "הסרת הרשאות ניהול"}\n\n` +
        `כדי לבטל את הנעילה ולהחזיר את כל ההרשאות והתפקידים לקדמותם, השתמש ב-**\`/unlockserver\`**.`,
      color: COLORS.ERROR,
      thumbnail: guild.iconURL({ dynamic: true }) || null,
      footerText: `נעילת חירום הופעלה על ידי ${interaction.user.tag}`,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
