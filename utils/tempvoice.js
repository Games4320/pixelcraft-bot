/**
 * מערכת TempVoice - "הצטרף כדי ליצור" (Join to Create)
 * כשמשתמש מצטרף לערוץ ה-JTC, נוצר לו ערוץ קולי זמני משלו,
 * והוא מקבל שליטה מלאה עליו (נעילה, הגבלה, שינוי שם ועוד).
 */
const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const {
  getGuildConfig,
  updateGuildConfig,
  readDB,
  writeDB,
} = require("./database");

const DEFAULT_CHANNEL_NAME = "ערוץ של {user}";
const NAME_PLACEHOLDER_LIMIT = 100;

/**
 * מחזיר את מבנה נתוני ה-TempVoice של השרת (יוצר אם לא קיים)
 */
function getTVData(guildId) {
  const db = readDB();
  if (!db.tempvoice) db.tempvoice = {};
  if (!db.tempvoice[guildId]) {
    db.tempvoice[guildId] = {
      joinToCreateChannelId: null,
      category: null,
      channelName: DEFAULT_CHANNEL_NAME,
      userLimit: 0,
      // מיפוי: מזהה ערוץ זמני -> מידע על הערוץ
      channels: {},
    };
    writeDB(db);
  }
  const data = db.tempvoice[guildId];
  if (!data.channels) data.channels = {};
  return data;
}

function saveTVData() {
  writeDB(readDB());
}

/**
 * מחזיר את מזהה ערוץ "הצטרף כדי ליצור" של השרת
 */
function getJoinToCreateChannelId(guildId) {
  return getTVData(guildId).joinToCreateChannelId;
}

/**
 * בודק אם ערוץ קולי נתון הוא ערוץ TempVoice זמני
 */
function isTempVoiceChannel(guildId, channelId) {
  const data = getTVData(guildId);
  return !!data.channels[channelId];
}

/**
 * מחזיר את מידע הערוץ הזמני (כולל הבעלים)
 */
function getTempVoiceInfo(guildId, channelId) {
  return getTVData(guildId).channels[channelId] || null;
}

/**
 * מחזיר את הערוץ הזמני שמשתמש מסוים מחזיק בו (אם קיים)
 */
function getChannelByOwner(guildId, userId) {
  const data = getTVData(guildId);
  return (
    Object.entries(data.channels).find(([, info]) => info.ownerId === userId) ||
    null
  );
}

/**
 * יצירת ערוץ קולי זמני חדש למשתמש
 */
async function createTempChannel(newState) {
  const guild = newState.guild;
  const member = newState.member;
  const data = getTVData(guild.id);

  // למשתמש יש כבר ערוץ? לא ליצור שני
  const existing = getChannelByOwner(guild.id, member.id);
  if (existing) {
    await member.voice.setChannel(existing[0]).catch(() => {});
    return;
  }

  const parentId = data.category || newState.channel?.parentId || null;
  let tempChannel;
  try {
    tempChannel = await guild.channels.create({
      name: formatChannelName(data.channelName, member),
      type: ChannelType.GuildVoice,
      parent: parentId,
      userLimit: data.userLimit || 0,
      permissionOverwrites: [
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ViewChannel,
          ],
        },
        {
          id: guild.members.me.id,
          allow: [
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MoveMembers,
          ],
        },
      ],
    });
  } catch (err) {
    console.error("[TempVoice] שגיאה ביצירת ערוץ זמני:", err);
    return;
  }

  data.channels[tempChannel.id] = {
    ownerId: member.id,
    createdAt: Date.now(),
  };
  saveTVData();

  // מעביר את המשתמש לערוץ החדש
  await member.voice.setChannel(tempChannel).catch(() => {});

  // לוח בקרה בערוץ הטקסט של הערוץ הקולי
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🎙️ הערוץ הזמני שלך מוכן!")
    .setDescription(
      `שלום ${member}! זהו **הערוץ הפרטי** שלך.\n` +
        `אתה ה**בעלים** של הערוץ ויש לך שליטה מלאה עליו.\n\n` +
        `**פקודות זמינות (סלאש):**\n` +
        `🔹 \`/voice lock\` — נעילת הערוץ\n` +
        `🔹 \`/voice unlock\` — ביטול נעילה\n` +
        `🔹 \`/voice limit\` — הגבלת מספר משתמשים\n` +
        `🔹 \`/voice name\` — שינוי שם הערוץ\n` +
        `🔹 \`/voice claim\` — דרישת בעלות (אם הבעלים עזב)\n` +
        `🔹 \`/voice kick\` — הוצאת משתמש מהערוץ\n` +
        `🔹 \`/voice invite\` — הזמנת משתמש לערוץ נעול\n` +
        `🔹 \`/voice ghost\` — הסתרת הערוץ\n` +
        `🔹 \`/voice reveal\` — הצגת הערוץ מחדש\n` +
        `🔹 \`/voice trust\` / \`/voice untrust\` — ניהול משתמשים מהימנים\n\n` +
        `⚠️ הערוץ יימחק **אוטומטית** כשכולם יעזבו!`,
    )
    .setFooter({ text: `${guild.name} • מערכת TempVoice` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("tv_lock")
      .setLabel("🔒 נעילה")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("tv_unlock")
      .setLabel("🔓 ביטול נעילה")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("tv_limit")
      .setLabel("👥 הגבלה")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("tv_claim")
      .setLabel("👑 דרישת בעלות")
      .setStyle(ButtonStyle.Secondary),
  );

  await tempChannel
    .send({
      embeds: [embed],
      components: [row],
    })
    .catch(() => {});
}

function formatChannelName(template, member) {
  let name = template || DEFAULT_CHANNEL_NAME;
  name = name
    .replace(/\{user\}/g, member.user.username)
    .replace(/\{nickname\}/g, member.displayName)
    .replace(/\{count\}/g, "1");
  return name.slice(0, NAME_PLACEHOLDER_LIMIT);
}

/**
 * טיפול ביציאת משתמש מערוץ זמני - מחיקה אם ריק
 */
async function handleLeave(oldState) {
  const guild = oldState.guild;
  const channelId = oldState.channelId;
  const data = getTVData(guild.id);
  const info = data.channels[channelId];
  if (!info) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel) {
    delete data.channels[channelId];
    saveTVData();
    return;
  }

  // אם הבעלים עזב אך עדיין יש אנשים בערוץ - הבעלות תידרש ידנית
  if (channel.members.size === 0) {
    try {
      await channel.delete("TempVoice: הערוץ התרוקן");
    } catch (err) {
      console.error("[TempVoice] שגיאה במחיקת ערוץ זמני:", err);
    }
    delete data.channels[channelId];
    saveTVData();
  }
}

/**
 * טיפול במעבר בין ערוצים
 */
async function handleSwitch(oldState, newState) {
  await handleLeave(oldState);
}

/**
 * הגדרת ערוץ "הצטרף כדי ליצור"
 */
function setJoinToCreateChannel(guildId, channelId, category = null) {
  const data = getTVData(guildId);
  data.joinToCreateChannelId = channelId;
  if (category) data.category = category;
  saveTVData();
}

/**
 * ביטול הגדרת "הצטרף כדי ליצור"
 */
function clearJoinToCreateChannel(guildId) {
  const data = getTVData(guildId);
  data.joinToCreateChannelId = null;
  data.category = null;
  saveTVData();
}

/**
 * ניקוי ערוצים יתומים (שנמחקו ידנית) בעת הפעלת הבוט
 */
function cleanupOrphanedChannels(client) {
  for (const [guildId] of Object.entries(readDB().tempvoice || {})) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;
    const data = getTVData(guildId);
    for (const channelId of Object.keys(data.channels)) {
      if (!guild.channels.cache.has(channelId)) {
        delete data.channels[channelId];
      }
    }
    saveTVData();
  }
}

module.exports = {
  getTVData,
  getJoinToCreateChannelId,
  isTempVoiceChannel,
  getTempVoiceInfo,
  getChannelByOwner,
  createTempChannel,
  handleLeave,
  handleSwitch,
  setJoinToCreateChannel,
  clearJoinToCreateChannel,
  cleanupOrphanedChannels,
  formatChannelName,
  DEFAULT_CHANNEL_NAME,
};
