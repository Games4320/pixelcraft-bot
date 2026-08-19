const { logMemberLeave } = require("../utils/logger");

module.exports = {
  name: "guildMemberRemove",
  async execute(member) {
    if (!member || !member.guild) return;
    await logMemberLeave(member.guild, member).catch(() => {});
  },
};
