const { logMessageEdit } = require("../utils/logger");

module.exports = {
  name: "messageUpdate",
  async execute(oldMessage, newMessage) {
    if (!newMessage || !newMessage.guild) return;
    if (newMessage.author?.bot) return;

    // Skip if content didn't change (e.g. embed preview loaded)
    if (oldMessage.content === newMessage.content) return;

    await logMessageEdit(newMessage.guild, {
      author: newMessage.author || null,
      channel: newMessage.channel || null,
      oldContent: oldMessage.content || "",
      newContent: newMessage.content || "",
      messageUrl: newMessage.url || null,
    }).catch(() => {});
  },
};
