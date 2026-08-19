module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        try {
            const me = guild.members.me || await guild.members.fetchMe().catch(() => null);
            if (me) {
                const desiredNick = `${guild.name} Bot`.slice(0, 32);
                await me.setNickname(desiredNick).catch(() => {});
            }
        } catch (e) {}
    }
};
