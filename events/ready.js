const { ActivityType, REST, Routes } = require('discord.js');
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
            activities: [{ name: '/ticket | !help1', type: ActivityType.Playing }],
            status: 'online'
        });

        // Initialize invite tracking cache for welcome message inviter detection
        await initInviteTracker(client);

        // Auto-deploy slash commands instantly to all connected guilds
        try {
            const commands = [];
            client.slashCommands.forEach(cmd => {
                if (cmd.data) commands.push(cmd.data.toJSON());
            });

            const token = process.env.DISCORD_TOKEN;
            if (token && token !== 'YOUR_BOT_TOKEN_HERE') {
                const rest = new REST({ version: '10' }).setToken(token);

                for (const guild of client.guilds.cache.values()) {
                    await rest.put(
                        Routes.applicationGuildCommands(client.user.id, guild.id),
                        { body: commands }
                    ).catch(e => console.log(`[AutoDeploy] Guild ${guild.name} notice:`, e.message));
                    console.log(`[AutoDeploy] Slash commands instantly registered in guild: ${guild.name}`);
                }

                // Also register globally
                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    { body: commands }
                ).catch(e => console.log(`[AutoDeploy] Global notice:`, e.message));
                console.log(`[AutoDeploy] Slash commands registered globally.`);
            }
        } catch (err) {
            console.error('[AutoDeploy] Error during startup command registration:', err.message);
        }
    }
};
