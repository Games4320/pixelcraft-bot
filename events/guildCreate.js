module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        try {
            const botMember = guild.members.me || await guild.members.fetchMe().catch(() => null);
            if (botMember && botMember.manageable) {
                const desiredNick = `${guild.name} Bot`.slice(0, 32);
                await botMember.setNickname(desiredNick).catch(() => {});
            }
        } catch (e) {}
    }
};
