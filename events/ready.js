const { ActivityType } = require('discord.js');
const { initInviteTracker } = require('../utils/inviteTracker');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`====================================================`);
        console.log(`🤖 Bot is online as ${client.user.tag}!`);
        console.log(`Serving in ${client.guilds.cache.size} servers.`);
        console.log(`====================================================`);

        // Set rich bot status
        client.user.setPresence({
            activities: [{ name: 'play.birzia.co.il | !help1', type: ActivityType.Playing }],
            status: 'online'
        });

        // Initialize invite tracking cache for welcome message inviter detection
        await initInviteTracker(client);
    }
};
