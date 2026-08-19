const { addXP } = require('../utils/database');
const { createEmbed, COLORS } = require('../utils/embedBuilder');

const PREFIX = '!';

// Deduplication cache for message IDs to prevent double processing in event handlers
const processedMessages = new Set();

// XP Gain Cooldown: 45 seconds per user to prevent XP spamming
const xpCooldowns = new Map();
const XP_COOLDOWN_MS = 45 * 1000;

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignore bots and DM messages
        if (message.author.bot || !message.guild) return;

        // Prevent processing the exact same message twice
        if (processedMessages.has(message.id)) return;
        processedMessages.add(message.id);
        // Clean up memory after 1 minute
        setTimeout(() => processedMessages.delete(message.id), 60000);

        // Check if message is a prefix command
        const isCommand = message.content.startsWith(PREFIX);

        // 1. Award XP only for regular chat messages (not commands) and with cooldown
        if (!isCommand) {
            const now = Date.now();
            const xpKey = `${message.guild.id}_${message.author.id}`;
            const lastXPTime = xpCooldowns.get(xpKey) || 0;

            if (now - lastXPTime >= XP_COOLDOWN_MS) {
                try {
                    xpCooldowns.set(xpKey, now);
                    const xpResult = addXP(message.guild.id, message.author.id, 5);
                    if (xpResult.leveledUp) {
                        const levelEmbed = createEmbed({
                            title: '🎉 עלית רמה!',
                            description: `כל הכבוד ${message.author}! הגעת ל**רמה ${xpResult.newLevel}**! ⭐`,
                            color: COLORS.SUCCESS,
                            thumbnail: message.author.displayAvatarURL({ dynamic: true }),
                            footerText: `${message.guild.name} • מערכת רמות`
                        });
                        await message.channel.send({ embeds: [levelEmbed] }).catch(() => {});
                    }
                } catch (err) {
                    console.error('Error adding XP:', err);
                }
            }
        }

        // 2. Handle Prefix Commands
        if (!isCommand) return;

        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.prefixCommands.get(commandName);
        if (!command) return;

        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`Error executing prefix command !${commandName}:`, error);
            await message.reply('❌ אירעה שגיאה בעת ביצוע הפקודה.').catch(() => {});
        }
    }
};
