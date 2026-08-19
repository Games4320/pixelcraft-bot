module.exports = {
    name: 'guildUpdate',
    async execute(oldGuild, newGuild) {
        if (oldGuild.name !== newGuild.name) {
            try {
                const me = newGuild.members.me || await newGuild.members.fetchMe().catch(() => null);
                if (me) {
                    const desiredNick = `${newGuild.name} Bot`.slice(0, 32);
                    await me.setNickname(desiredNick).catch(() => {});
                }
            } catch (e) {}
        }
    }
};
