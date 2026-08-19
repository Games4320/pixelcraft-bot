module.exports = {
    name: 'guildUpdate',
    async execute(oldGuild, newGuild) {
        if (oldGuild.name !== newGuild.name) {
            try {
                const botMember = newGuild.members.me || await newGuild.members.fetchMe().catch(() => null);
                if (botMember && botMember.manageable) {
                    const desiredNick = `${newGuild.name} Bot`.slice(0, 32);
                    await botMember.setNickname(desiredNick).catch(() => {});
                }
            } catch (e) {}
        }
    }
};
