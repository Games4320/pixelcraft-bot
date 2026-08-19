require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
    console.error('❌ DISCORD_TOKEN is missing or set to placeholder in .env file!');
    process.exit(1);
}

if (!clientId || clientId === 'YOUR_CLIENT_ID_HERE') {
    console.error('❌ CLIENT_ID is missing or set to placeholder in .env file!');
    process.exit(1);
}

const commands = [];
const slashCommandsPath = path.join(__dirname, 'commands', 'slash');
const commandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(slashCommandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`Loaded slash command: /${command.data.name}`);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`\nStarted refreshing ${commands.length} application (/) commands.`);

        // 1. Instant deployment to all current guilds
        try {
            const guilds = await rest.get(Routes.userGuilds());
            for (const guild of guilds) {
                await rest.put(
                    Routes.applicationGuildCommands(clientId, guild.id),
                    { body: commands }
                );
                console.log(`✅ Instantly deployed ${commands.length} commands to guild: ${guild.name}`);
            }
        } catch (guildErr) {
            console.log('Notice deploying to guilds:', guildErr.message);
        }

        // 2. Global deployment
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );
        console.log(`✅ Successfully reloaded ${data.length} global slash commands.`);
    } catch (error) {
        console.error('❌ Error deploying slash commands:', error);
    }
})();
