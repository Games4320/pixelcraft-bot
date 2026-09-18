const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { createErrorEmbed } = require("../../utils/embedBuilder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editmessage")
    .setDescription(
      "עריכת הודעה קיימת לפי מזהה (טריק וובהוק - נראה כאילו המשתמש ערך אותה)",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((option) =>
      option
        .setName("message_id")
        .setDescription("מזהה ההודעה לעריכה")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("התוכן החדש של ההודעה")
        .setRequired(true),
    ),
  async execute(interaction) {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return interaction.reply({
        embeds: [
          createErrorEmbed(
            "❌ אין לך הרשאה מתאימה (ניהול הודעות - Manage Messages) לביצוע פקודה זו.",
          ),
        ],
        ephemeral: true,
      });
    }

    // Also make sure the bot itself can manage messages/webhooks
    if (
      !interaction.guild.members.me.permissions.has(
        PermissionFlagsBits.ManageMessages,
      )
    ) {
      return interaction.reply({
        embeds: [createErrorEmbed("❌ אין לי הרשאת ניהול הודעות בשרת הזה.")],
        ephemeral: true,
      });
    }

    const messageId = interaction.options.getString("message_id");
    const newContent = interaction.options.getString("message");

    await interaction.deferReply({ ephemeral: true });

    try {
      // Try to find the message in the current channel
      let targetMessage = null;
      try {
        targetMessage = await interaction.channel.messages.fetch(messageId);
      } catch {
        // Not in this channel - search last 100 messages across visible text channels as fallback
        return interaction.editReply({
          embeds: [
            createErrorEmbed(
              "❌ לא נמצאה הודעה עם המזהה הזה בערוץ הנוכחי. הרץ את הפקודה באותו ערוץ שבו נמצאת ההודעה.",
            ),
          ],
        });
      }

      if (targetMessage.webhookId || targetMessage.author.bot) {
        return interaction.editReply({
          embeds: [
            createErrorEmbed("❌ לא ניתן לערוך הודעות של בוטים או וובהוקים."),
          ],
        });
      }

      if (!targetMessage.content || targetMessage.content.length === 0) {
        return interaction.editReply({
          embeds: [
            createErrorEmbed(
              "❌ לא ניתן לערוך הודעה ללא תוכן טקסט (למשל הודעה עם תמונה בלבד).",
            ),
          ],
        });
      }

      if (newContent.length > 2000) {
        return interaction.editReply({
          embeds: [
            createErrorEmbed("❌ ההודעה החדשה ארוכה מדי (מקסימום 2000 תווים)."),
          ],
        });
      }

      // Save original author info
      const username = targetMessage.author.username;
      const avatarURL = targetMessage.author.displayAvatarURL({ size: 128 });
      const originalChannel = targetMessage.channel;

      // Delete original message
      await targetMessage.delete();

      // Re-send via webhook impersonating the author
      const webhooks = await originalChannel.fetchWebhooks();
      let webhook = webhooks.find(
        (wh) =>
          wh.name === "EditMessageTroll" &&
          wh.owner &&
          wh.owner.id === interaction.client.user.id,
      );

      if (!webhook) {
        webhook = await originalChannel.createWebhook({
          name: "EditMessageTroll",
          avatar: interaction.client.user.displayAvatarURL(),
          reason: "EditMessage command",
        });
      }

      await webhook.send({
        content: newContent,
        username: username,
        avatarURL: avatarURL,
        allowedMentions: { parse: [] }, // don't ping anyone with the fake message
      });

      const { createSuccessEmbed } = require("../../utils/embedBuilder");
      return interaction.editReply({
        embeds: [
          createSuccessEmbed(
            "ההודעה נערכה בהצלחה 🎭",
            `ההודעה של **${username}** נערכה ל:\n>>> ${newContent.length > 500 ? newContent.slice(0, 500) + "..." : newContent}`,
          ),
        ],
      });
    } catch (error) {
      console.error("Error editing message:", error);
      return interaction.editReply({
        embeds: [
          createErrorEmbed(
            "אירעה שגיאה בעת עריכת ההודעה. ייתכן שההודעה נמחקה או שחסרות לי הרשאות.",
          ),
        ],
      });
    }
  },
};
