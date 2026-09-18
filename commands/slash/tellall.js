const { SlashCommandBuilder } = require("discord.js");
const {
  createErrorEmbed,
  createSuccessEmbed,
} = require("../../utils/embedBuilder");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tellall")
    .setDescription("שולח הודעה פרטית (DM) לכל חברי השרת")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("הודעה לשליחה לכל החברים")
        .setRequired(true),
    ),

  async execute(interaction) {
    // רק מנהלי שרת יכולים להשתמש — מניעת רעבון/ספאם
    if (!interaction.member.permissions.has("ManageGuild")) {
      return interaction.reply({
        embeds: [createErrorEmbed("❌ פקודה זו זמינה רק למנהלי השרת!")],
        ephemeral: true,
      });
    }

    const text = interaction.options.getString("message");
    await interaction.reply({
      embeds: [createSuccessEmbed("⏳ מתחיל לשלוח הודעות לכל החברים...")],
    });

    const members = await interaction.guild.members.fetch();
    let sent = 0,
      failed = 0,
      skipped = 0;

    for (const [, member] of members) {
      // לדלג על בוטים ומי שכיבה DMs
      if (member.user.bot) {
        skipped++;
        continue;
      }

      try {
        await member.send(
          `📨 **הודעה מהשרת ${interaction.guild.name}:**\n\n${text}`,
        );
        sent++;
      } catch {
        failed++;
      }
      // המתנה קצרה בין הודעות כדי לא להיתקע ברייט-לימיט של דיסקורד
      await new Promise((res) => setTimeout(res, 1000));
    }

    await interaction.editReply({
      embeds: [
        createSuccessEmbed(
          `✅ סיימתי!\n\n` +
            `📬 נשלחו: **${sent}**\n` +
            `⚠️ נכשלו (DM סגור/חסום): **${failed}**\n` +
            `🤖 בוטים שדולגו: **${skipped}**`,
        ),
      ],
    });
  },
};
