require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { onInviteCreate, onInviteDelete } = require('./utils/inviteTracker');

// Optional lightweight HTTP server for Render / Cloud hosting health checks
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Discord Bot is running online 24/7!');
}).listen(PORT, () => {
    console.log(`[HTTP Server] Health check listening on port ${PORT}`);
});

// Initialize Discord Client with all required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

client.prefixCommands = new Collection();
client.slashCommands = new Collection();

// 1. Load Prefix Commands
const prefixCommandsPath = path.join(__dirname, 'commands', 'prefix');
if (fs.existsSync(prefixCommandsPath)) {
    const prefixFiles = fs.readdirSync(prefixCommandsPath).filter(file => file.endsWith('.js'));
    for (const file of prefixFiles) {
        const filePath = path.join(prefixCommandsPath, file);
        const command = require(filePath);
        if ('name' in command && 'execute' in command) {
            client.prefixCommands.set(command.name.toLowerCase(), command);
            if (Array.isArray(command.aliases)) {
                for (const alias of command.aliases) {
                    client.prefixCommands.set(alias.toLowerCase(), command);
                }
            }
            console.log(`Loaded prefix command: !${command.name}`);
        }
    }
}

// 2. Load Slash Commands
const slashCommandsPath = path.join(__dirname, 'commands', 'slash');
if (fs.existsSync(slashCommandsPath)) {
    const slashFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));
    for (const file of slashFiles) {
        const filePath = path.join(slashCommandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.slashCommands.set(command.data.name, command);
            console.log(`Loaded slash command: /${command.data.name}`);
        }
    }
}

// 3. Load Event Handlers
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`Loaded event handler: ${event.name}`);
    }
}

// 4. Invite Tracker Event Listeners
client.on('inviteCreate', invite => onInviteCreate(invite));
client.on('inviteDelete', invite => onInviteDelete(invite));

// 5. Global Error Handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.error('Uncaught Exception:', err, 'at:', origin);
});

client.on('error', err => {
    console.error('Discord Client Error:', err);
});

// 6. Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
    console.log('\n====================================================');
    console.log('⚠️ DISCORD_TOKEN is set to placeholder in .env file!');
    console.log('Please edit the .env file and paste your bot token.');
    console.log('====================================================\n');
} else {
    client.login(token).catch(err => {
        console.error('Failed to log in to Discord:', err.message);
    });
}
