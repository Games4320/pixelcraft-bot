const { addXP } = require('../utils/database');
const { createEmbed, COLORS } = require('../utils/embedBuilder');

const PREFIX = '!';

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignore bots and DM messages
        if (message.author.bot || !message.guild) return;

        // 1. Award +5 XP for every message sent
        try {
            const xpResult = addXP(message.guild.id, message.author.id, 5);
            if (xpResult.leveledUp) {
                const levelEmbed = createEmbed({
                    title: '🎉 עלית רמה!',
                    description: `כל הכבוד ${message.author}! הגעת ל**רמה ${xpResult.newLevel}**! ⭐`,
                    color: COLORS.SUCCESS,
                    thumbnail: message.author.displayAvatarURL({ dynamic: true })
                });
                await message.channel.send({ embeds: [levelEmbed] }).catch(() => {});
            }
        } catch (err) {
            console.error('Error adding XP:', err);
        }

        // 2. Handle Prefix Commands
        if (!message.content.startsWith(PREFIX)) return;

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
