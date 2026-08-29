const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const {
  isTempVoiceChannel,
  getTempVoiceInfo,
  getChannelByOwner,
} = require("../../utils/tempvoice");
const {
  createErrorEmbed,
  createSuccessEmbed,
} = require("../../utils/embedBuilder");

/**
 * בדיקה האם למשתמש יש הרשאה לשלוט בערוץ (בעלים, מהימן או מנהל שרת)
 */
function hasControl(interaction, info) {
  if (!info) return false;
  if (interaction.member.permissions.has(PermissionFlagsBits.ManageChannels))
    return true;
  return (
    info.ownerId === interaction.user.id ||
    (info.trusted || []).includes(interaction.user.id)
  );
}

function notOwnerReply(interaction) {
  return interaction.reply({
    embeds: [
      createErrorEmbed("❌ פקודה זו זמינה רק ל**בעלי הערוץ** או למנהלי השרת!"),
    ],
    ephemeral: true,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("voice")
    .setDescription("שליטה בערוץ הקולי הזמני שלך (מערכת TempVoice)")
    .addSubcommand((sub) =>
      sub
        .setName("lock")
        .setDescription("🔒 נעילת הערוץ הזמני שלך (אסור להצטרף)"),
    )
    .addSubcommand((sub) =>
      sub.setName("unlock").setDescription("🔓 ביטול נעילת הערוץ הזמני שלך"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("limit")
        .setDescription("👥 הגבלת מספר המשתמשים בערוץ שלך")
        .addIntegerOption((opt) =>
          opt
            .setName("amount")
            .setDescription("מספר המשתמשים המותר (0 = ללא הגבלה)")
            .setMinValue(0)
            .setMaxValue(99)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("name")
        .setDescription("✏️ שינוי שם הערוץ הזמני שלך")
        .addStringOption((opt) =>
          opt
            .setName("text")
            .setDescription("השם החדש לערוץ")
            .setMaxLength(50)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("claim")
        .setDescription("👑 דרישת בעלות על הערוץ (כשהבעלים עזב)"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("kick")
        .setDescription("🦵 הוצאת משתמש מהערוץ שלך")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("המשתמש להוצאה").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("invite")
        .setDescription("✉️ הזמנת משתמש לערוץ הנעול שלך")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("המשתמש להזמנה").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("ghost").setDescription("👻 הסתרת הערוץ שלך ממשתמשים אחרים"),
    )
    .addSubcommand((sub) =>
      sub.setName("reveal").setDescription("👁️ הצגת הערוץ המוסתר שלך מחדש"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("trust")
        .setDescription("🤝 הענקת גישה מלאה למשתמש בערוץ שלך")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("המשתמש להוספה").setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("untrust")
        .setDescription("💔 ביטול הגישה המלאה של משתמש בערוץ שלך")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("המשתמש להסרה").setRequired(true),
        ),
    ),
  async execute(interaction) {
    const guild = interaction.guild;
    const member = interaction.member;
    const subcommand = interaction.options.getSubcommand();
    const voiceChannel = member.voice?.channel;

    // פקודת claim יכולה לרוץ גם בלי להיות בערוץ עצמו (דרישת בעלות על הערוץ בו המשתמש נמצא)
    const targetChannelId = voiceChannel?.id;

    if (!targetChannelId || !isTempVoiceChannel(guild.id, targetChannelId)) {
      return interaction.reply({
        embeds: [
          createErrorEmbed(
            "❌ עליך להיות **בתוך ערוץ זמני** (TempVoice) כדי להשתמש בפקודה זו!",
          ),
        ],
        ephemeral: true,
      });
    }

    const info = getTempVoiceInfo(guild.id, targetChannelId);
    const channel = voiceChannel;
    const me = guild.members.me;

    switch (subcommand) {
      // ============ נעילה ============
      case "lock": {
        if (!hasControl(interaction, info)) return notOwnerReply(interaction);
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
          Connect: false,
        });
        return interaction.reply({
          embeds: [
            createSuccessEmbed(
              "🔒 הערוץ ננעל",
              `${channel} ננעל בהצלחה! רק משתמשים מורשים יכולים להצטרף.`,
            ),
          ],
          ephemeral: true,
        });
      }

      // ============ ביטול נעילה ============
      case "unlock": {
        if (!hasControl(interaction, info)) return notOwnerReply(interaction);
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
          Connect: null,
        });
        return interaction.reply({
          embeds: [
            createSuccessEmbed("🔓 הערוץ נפתח", `${channel} פתוח כעת לכולם!`),
          ],
          ephemeral: true,
        });
      }

      // ============ הגבלת משתמשים ============
      case "limit": {
        if (!hasControl(interaction, info)) return notOwnerReply(interaction);
        const amount = interaction.options.getInteger("amount");
        await channel.setUserLimit(amount);
        return interaction.reply({
          embeds: [
            createSuccessEmbed(
              "👥 הגבלה עודכנה",
              amount === 0
                ? `ההגבלה על ${channel} הוסרה — כעת אין הגבלת משתמשים.`
                : `ההגבלה על ${channel} הוגדרה ל**${amount}** משתמשים.`,
            ),
          ],
          ephemeral: true,
        });
      }

      // ============ שינוי שם ============
      case "name": {
        if (
          info.ownerId !== interaction.user.id &&
          !member.permissions.has(PermissionFlagsBits.ManageChannels)
        ) {
          return notOwnerReply(interaction);
        }
        const text = interaction.options.getString("text");
        await channel.setName(text);
        return interaction.reply({
          embeds: [
            createSuccessEmbed(
              "✏️ השם שונה",
              `שם הערוץ שונה ל**${text}** בהצלחה!`,
            ),
          ],
          ephemeral: true,
        });
      }

      // ============ דרישת בעלות ============
      case "claim": {
        if (info.ownerId === interaction.user.id) {
          return interaction.reply({
            embeds: [createErrorEmbed("❌ אתה כבר הבעלים של הערוץ הזה!")],
            ephemeral: true,
          });
        }
        // ניתן לדרוש בעלות רק אם הבעלים המקורי כבר לא בערוץ
        const ownerMember = guild.members.cache.get(info.ownerId);
        const ownerStillIn = ownerMember?.voice?.channelId === channel.id;
        if (ownerStillIn) {
          return interaction.reply({
            embeds: [
              createErrorEmbed(
                "❌ לא ניתן לדרוש בעלות — הבעלים המקורי עדיין נמצא בערוץ!",
              ),
            ],
            ephemeral: true,
          });
        }
        info.ownerId = interaction.user.id;
        const { readDB, writeDB } = require("../../utils/database");
        writeDB(readDB());
        await channel.permissionOverwrites.edit(interaction.user.id, {
          Connect: true,
          Speak: true,
          MuteMembers: true,
          DeafenMembers: true,
          MoveMembers: true,
          ManageChannels: true,
          ViewChannel: true,
        });
        return interaction.reply({
          embeds: [
            createSuccessEmbed(
              "👑 בעלות נתבעה!",
              `${interaction.user} הפך כעת ל**בעלים החדש** של ${channel}!`,
            ),
          ],
        });
      }

      // ============ הוצאת משתמש ============
      case "kick": {
        if (!hasControl(interaction, info)) return notOwnerReply(interaction);
        const target = interaction.options.getMember("user");
        if (
          !target?.voice?.channelId ||
          target.voice.channelId !== channel.id
        ) {
          return interaction.reply({
            embeds: [createErrorEmbed("❌ המשתמש הזה לא נמצא בערוץ שלך!")],
            ephemeral: true,
          });
        }
        await target.voice.disconnect("הוצא מהערוץ הזמני על ידי בעל הערוץ");
        return interaction.reply({
          embeds: [
            createSuccessEmbed(
              "🦵 המשתמש הוצא",
              `${target} הוצא מהערוץ בהצלחה!`,
            ),
          ],
          ephemeral: true,
        });
      }

      // ============ הזמנה ============
      case "invite": {
        if (!hasControl(interaction, info)) return notOwnerReply(interaction);
        const target = interaction.options.getUser("user");
        await channel.permissionOverwrites.edit(target.id, {
          Connect: true,
          ViewChannel: true,
        });
        try {
          await target.send({
            embeds: [
              createSuccessEmbed(
                "✉️ הזמנה לערוץ קולי",
                `**${interaction.user.tag}** הזמין אותך להצטרף לערוץ **${channel.name}** בשרת **${guild.name}**!`,
              ),
            ],
          });
        } catch (_) {
          /* DM סגור - לא נורא */
        }
        return interaction.reply({
          embeds: [
            createSuccessEmbed(
              "✉️ המשתמש הוזמן",
              `${target} קיבל גישה לערוץ שלך!`,
            ),
          ],
          ephemeral: true,
        });
      }

      // ============ הסתרה ============
      case "ghost": {
        if (!hasControl(interaction, info)) return notOwnerReply(interaction);
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
          ViewChannel: false,
        });
        return interaction.reply({
          embeds: [
            createSuccessEmbed(
              "👻 הערוץ הוסתר",
              `${channel} הוסתר מהרשימה של המשתמשים הרגילים.`,
            ),
          ],
          ephemeral: true,
        });
      }

      // ============ הצגה מחדש ============
      case "reveal": {
        if (!hasControl(interaction, info)) return notOwnerReply(interaction);
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
          ViewChannel: null,
        });
        return interaction.reply({
          embeds: [
            createSuccessEmbed(
              "👁️ הערוץ הוצג",
              `${channel} מוצג כעת שוב לכולם.`,
            ),
          ],
          ephemeral: true,
        });
      }

      // ============ משתמש מהימן ============
      case "trust": {
        if (
          info.ownerId !== interaction.user.id &&
          !member.permissions.has(PermissionFlagsBits.ManageChannels)
        ) {
          return notOwnerReply(interaction);
        }
        const target = interaction.options.getUser("user");
        if (!info.trusted) info.trusted = [];
        if (info.trusted.includes(target.id)) {
          return interaction.reply({
            embeds: [createErrorEmbed("❌ המשתמש הזה כבר מהימן בערוץ שלך!")],
            ephemeral: true,
          });
        }
        info.trusted.push(target.id);
        const { readDB, writeDB } = require("../../utils/database");
        writeDB(readDB());
        await channel.permissionOverwrites.edit(target.id, {
          Connect: true,
          Speak: true,
          MuteMembers: true,
          DeafenMembers: true,
          MoveMembers: true,
          ViewChannel: true,
        });
        return interaction.reply({
          embeds: [
            createSuccessEmbed(
              "🤝 המשתמש נוסף",
              `${target} קיבל גישה מלאה לערוץ שלך!`,
            ),
          ],
          ephemeral: true,
        });
      }

      // ============ הסרת משתמש מהימן ============
      case "untrust": {
        if (
          info.ownerId !== interaction.user.id &&
          !member.permissions.has(PermissionFlagsBits.ManageChannels)
        ) {
          return notOwnerReply(interaction);
        }
        const target = interaction.options.getUser("user");
        if (!info.trusted || !info.trusted.includes(target.id)) {
          return interaction.reply({
            embeds: [createErrorEmbed("❌ המשתמש הזה לא מהימן בערוץ שלך!")],
            ephemeral: true,
          });
        }
        info.trusted = info.trusted.filter((id) => id !== target.id);
        const { readDB, writeDB } = require("../../utils/database");
        writeDB(readDB());
        await channel.permissionOverwrites.delete(target.id).catch(() => {});
        return interaction.reply({
          embeds: [
            createSuccessEmbed(
              "💔 המשתמש הוסר",
              `הגישה המלאה של ${target} בוטלה.`,
            ),
          ],
          ephemeral: true,
        });
      }
    }
  },
};
