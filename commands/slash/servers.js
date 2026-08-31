const { SlashCommandBuilder } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servers')
        .setDescription('הצגת רשימת כל השרתים שהבוט נמצא בהם (DM בלבד)'),

    async execute(interaction) {
        // Only allowed in DMs with the bot
        if (interaction.guildId !== null || interaction.channel?.type !== 1) {
            return interaction.reply({
                content: '❌ הפקודה הזו זמינה רק בצ׳אט פרטי (DM) עם הבוט.',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const guilds = [...interaction.client.guilds.cache.values()]
            .sort((a, b) => b.memberCount - a.memberCount);

        if (guilds.length === 0) {
            return interaction.editReply({ content: 'ℹ️ הבוט לא נמצא באף שרת כרגע.' });
        }

        // Try to find an invite link for each guild (best effort)
        async function getInviteLink(guild) {
            try {
                const invites = await guild.invites.fetch();
                if (invites.size > 0) return invites.first().url;
            } catch {}
            try {
                const vanity = await guild.fetchVanityData().catch(() => null);
                if (vanity && vanity.code) return `https://discord.gg/${vanity.code}`;
            } catch {}
            return null;
        }

        const results = await Promise.allSettled(guilds.map(g => getInviteLink(g)));

        // Discord embed limit: 4096 chars in description, split into chunks
        const lines = guilds.map((g, i) => {
            const link = results[i].status === 'fulfilled' ? results[i].value : null;
            const name = link ? `[${g.name}](${link})` : `**${g.name}** (אין הזמנה זמינה)`;
            return `**${i + 1}.** ${name} • 👥 \`${g.memberCount}\` משתמשים • ID: \`${g.id}\``;
        });

        const chunks = [];
        let current = '';
        for (const line of lines) {
            if ((current + line + '\n').length > 4000) {
                chunks.push(current);
                current = '';
            }
            current += line + '\n';
        }
        if (current) chunks.push(current);

        const embeds = chunks.map((chunk, idx) => createEmbed({
            title: idx === 0 ? `🌐 השרתים שהבוט נמצא בהם (${guilds.length})` : `🌐 המשך`,
            description: chunk,
            color: COLORS.PRIMARY,
            footerText: idx === chunks.length - 1 ? `סה"כ ${guilds.length} שרתים` : 'עמוד הבא ↓'
        }));

        await interaction.editReply({ embeds });
    }
};
