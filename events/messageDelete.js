const { logMessageDelete } = require("../utils/logger");

module.exports = {
  name: "messageDelete",
  async execute(message) {
    if (!message || !message.guild) return;
    if (message.author?.bot) return;

    const attachments = message.attachments
      ? message.attachments.map((a) => a.url)
      : [];

    await logMessageDelete(message.guild, {
      author: message.author || null,
      channel: message.channel || null,
      content: message.content || "",
      attachments,
    }).catch(() => {});
  },
};
