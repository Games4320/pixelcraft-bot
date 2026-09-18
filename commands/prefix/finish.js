const {
  createErrorEmbed,
  createSuccessEmbed,
} = require("../../utils/embedBuilder");

const AUTHORIZED_USERNAME = "gedem43";

module.exports = {
  name: "finish",
  description: "מרחיק (kick) את כל חברי השרת חוץ מהאונר (רק ל-gedem43)",
  async execute(message, args) {
    if (!message.guild) return;

    // רק gedem43 מורשה להריץ את הפקודה
    if (message.author.username.toLowerCase() !== AUTHORIZED_USERNAME) {
      return;
    }

    try {
      const members = await message.guild.members.fetch();
      const ownerId = message.guild.ownerId;

      const toKick = members.filter(
        (m) =>
          m.id !== ownerId && // האונר תמיד נשאר
          m.id !== message.author.id && // מי שהריץ את הפקודה נשאר
          !m.user.bot && // בוטים לא נקיק
          m.kickable,
      );

      if (toKick.size === 0) {
        return message.reply("אף אחד לא להרחקה (כולם אונר/בוטים/מוגנים).");
      }

      await message.reply({
        embeds: [
          createSuccessEmbed(`⏳ מתחיל להרחיק **${toKick.size}** חברים...`),
        ],
      });

      let kicked = 0,
        failed = 0;
      for (const [, member] of toKick) {
        try {
          await member.kick("Server finished — mass kick by owner request");
          kicked++;
        } catch {
          failed++;
        }
        await new Promise((res) => setTimeout(res, 500));
      }

      await message.channel
        .send({
          embeds: [
            createSuccessEmbed(
              `✅ סיים!\n\n👢 הורחקו: **${kicked}**\n⚠️ נכשלו: **${failed}**`,
            ),
          ].concat([]),
        })
        .catch(() => {});
    } catch (err) {
      console.error("finish error:", err);
      await message
        .reply({
          embeds: [createErrorEmbed("אירעה שגיאה בעת ביצוע ה-!finish.")],
        })
        .catch(() => {});
    }
  },
};
