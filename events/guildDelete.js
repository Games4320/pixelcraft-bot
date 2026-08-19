const { ActivityType } = require('discord.js');

module.exports = {
    name: 'guildDelete',
    async execute(guild, client) {
        try {
            if (client && client.user) {
                client.user.setPresence({
                    activities: [{ name: `${client.guilds.cache.size} servers`, type: ActivityType.Playing }],
                    status: 'online'
                });
            }
        } catch (e) {}
    }
};
