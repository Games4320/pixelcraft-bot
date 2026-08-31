const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { createEmbed, COLORS } = require("../../utils/embedBuilder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("moveall")
    .setDescription("העברת כל המשתמשים מהערוץ שלך לערוץ אחר")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("הערוץ המטרה - אליו יועברו כל המשתמשים")
        .setRequired(true),
    ),

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel("channel");

    // 1. User must be in a voice channel
    const member = interaction.member;
    const sourceChannel = member?.voice?.channel;

    if (!sourceChannel) {
      return interaction.reply({
        content: "❌ אתה צריך להיות בערוץ קולי כדי להשתמש בפקודה הזו.",
        ephemeral: true,
      });
    }

    // 2. Validate the target channel is a voice-type channel
    if (
      !targetChannel ||
      !["GuildVoice", "GuildStageVoice"].includes(targetChannel.type)
    ) {
      return interaction.reply({
        content: "❌ צריך לבחור ערוץ קולי תקין.",
        ephemeral: true,
      });
    }

    // 3. Can't move to the same channel
    if (targetChannel.id === sourceChannel.id) {
      return interaction.reply({
        content: "❌ אתה כבר בערוץ הזה! בחר ערוץ אחר.",
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    // 4. Bot needs MoveMembers permission in both channels
    const me = interaction.guild.members.me;
    if (!me.permissions.has(PermissionFlagsBits.MoveMembers)) {
      return interaction.editReply({
        content: "❌ אין לי הרשאת **העברת חברים (Move Members)**.",
      });
    }

    // 5. Move everyone (except bots) from the source channel
    const members = sourceChannel.members.filter((m) => !m.user.bot);
    if (members.size === 0) {
      return interaction.editReply({
        content: "ℹ️ אין משתמשים להעברה בערוץ שלך.",
      });
    }

    let moved = 0;
    let failed = 0;
    for (const m of members.values()) {
      try {
        await m.voice.setChannel(
          targetChannel,
          `הועבר על ידי ${interaction.user.tag} (/moveall)`,
        );
        moved++;
      } catch {
        failed++;
      }
    }

    const embed = createEmbed({
      title: "📦 העברת ערוץ הושלמה",
      color: COLORS.PRIMARY,
      description:
        moved > 0
          ? `הועברו **${moved}** משתמשים מ-${sourceChannel} אל ${targetChannel}.`
          : "לא הצלחתי להעביר אף משתמש.",
      fields:
        failed > 0
          ? [
              {
                name: "⚠️ נכשלו",
                value: `${failed} משתמשים (לא ניתן להעביר אותם)`,
              },
            ]
          : [],
      footerText: `בוצע על ידי ${interaction.user.username}`,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
