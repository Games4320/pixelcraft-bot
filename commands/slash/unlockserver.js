const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { getGuildConfig, updateGuildConfig } = require("../../utils/database");
const {
  createEmbed,
  createErrorEmbed,
  COLORS,
} = require("../../utils/embedBuilder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unlockserver")
    .setDescription(
      "🔓 ביטול נעילת החירום של השרת, פתיחת הערוצים ושחזור תפקידי הצוות",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;

    const isOwner = interaction.user.id === guild.ownerId;
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isOwner && !isAdmin) {
      return interaction.reply({
        embeds: [
          createErrorEmbed(
            "רק בעלי השרת או מנהלים ראשיים יכולים לבטל את נעילת החירום!",
          ),
        ],
        ephemeral: true,
      });
    }

    const config = getGuildConfig(guild.id);
    const lockdownData = config.lockdownData;

    if (!lockdownData) {
      return interaction.reply({
        embeds: [createErrorEmbed("השרת אינו נמצא כעת במצב נעילת חירום.")],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    // 1. Unlock channels (@everyone SendMessages: null/true)
    const unlockedChannels = [];
    const lockedIds = lockdownData.lockedChannelIds || [];

    for (const channelId of lockedIds) {
      const channel = guild.channels.cache.get(channelId);
      if (channel && channel.isTextBased()) {
        try {
          await channel.permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: null,
            AddReactions: null,
          });
          unlockedChannels.push(channel.id);
        } catch (err) {}
      }
    }

    // 2. Restore staff roles
    let restoredStaffCount = 0;
    const savedStaff = lockdownData.savedStaff || [];

    for (const entry of savedStaff) {
      try {
        const targetMember = await guild.members
          .fetch(entry.userId)
          .catch(() => null);
        if (targetMember && Array.isArray(entry.roles)) {
          await targetMember.roles.set(entry.roles).catch(() => {});
          restoredStaffCount++;
        }
      } catch (err) {
        console.error(
          `Failed to restore roles for ${entry.userId}:`,
          err.message,
        );
      }
    }

    // Clear lockdown data
    updateGuildConfig(guild.id, "lockdownData", null);

    const embed = createEmbed({
      title: "🔓 נעילת החירום בוטלה בהצלחה! (UNLOCKED)",
      description:
        `השרת **${guild.name}** חזר לפעילות תקינה ומלאה.\n\n` +
        `🔓 **ערוצים שנפתחו מחדש:** \`${unlockedChannels.length}\` ערוצים\n` +
        `👥 **אנשי צוות שתפקידיהם שוחזרו:** \`${restoredStaffCount}\` משתמשים\n` +
        `🛡️ כל ההרשאות והגישות חזרו למצבן הרגיל.`,
      color: COLORS.SUCCESS,
      thumbnail: guild.iconURL({ dynamic: true }) || null,
      footerText: `נעילת חירום בוטלה על ידי ${interaction.user.tag}`,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
