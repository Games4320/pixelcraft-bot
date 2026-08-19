const { addXP, incrementMessageCount } = require('../utils/database');
const { createEmbed, COLORS } = require('../utils/embedBuilder');
const { handleAutoMod } = require('../utils/autoMod');

const PREFIX = '!';

// Deduplication cache for message IDs to prevent double processing in event handlers
const processedMessages = new Set();

// XP Gain Cooldown: 20 seconds per user to allow natural, responsive progression
const xpCooldowns = new Map();
const XP_COOLDOWN_MS = 20 * 1000;

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

        // 0. Auto-Mod Security Check (Anti-Invite, Anti-Spam, Anti-Curse)
        const autoModResult = await handleAutoMod(message);
        if (autoModResult.blocked) return;

        // Increment user's message counter
        incrementMessageCount(message.guild.id, message.author.id);

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
                    // Award 15-25 XP randomly per message
                    const randomXP = Math.floor(Math.random() * 11) + 15;
                    const xpResult = addXP(message.guild.id, message.author.id, randomXP);

                    if (xpResult.leveledUp) {
                        const nextLevelXP = (xpResult.newLevel + 1) * 150;
                        const levelEmbed = createEmbed({
                            title: '🎉 עלית רמה!',
                            description: `כל הכבוד ${message.author}! עלית מ**רמה ${xpResult.oldLevel}** ל**רמה ${xpResult.newLevel}**! ⭐\n\n` +
                                         `✨ **סה"כ XP מצטבר:** **${xpResult.xp.toLocaleString()} XP** *(ה-XP נשמר לתמיד ולא מתאפס!)*\n` +
                                         `🎯 **הרמה הבאה (רמה ${xpResult.newLevel + 1}):** ב-**${nextLevelXP.toLocaleString()} XP**`,
                            color: COLORS.SUCCESS,
                            thumbnail: message.author.displayAvatarURL({ dynamic: true }),
                            footerText: `${message.guild.name} • מערכת רמות ו-XP`
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
