const { REST, Routes } = require('discord.js');

module.exports = {
    name: 'guildCreate',
    async execute(guild, client) {
        try {
            const commands = [];
            client.slashCommands.forEach(cmd => {
                if (cmd.data) commands.push(cmd.data.toJSON());
            });

            const token = process.env.DISCORD_TOKEN;
            if (token && token !== 'YOUR_BOT_TOKEN_HERE') {
                const rest = new REST({ version: '10' }).setToken(token);
                await rest.put(
                    Routes.applicationGuildCommands(client.user.id, guild.id),
                    { body: commands }
                );
                console.log(`[guildCreate] Slash commands instantly deployed to new guild: ${guild.name}`);
            }
        } catch (err) {
            console.error(`[guildCreate] Error deploying slash commands to ${guild.name}:`, err.message);
        }
    }
};
