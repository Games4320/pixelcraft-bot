const { getGuildConfig } = require('../utils/database');
const { findInviter } = require('../utils/inviteTracker');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            const config = getGuildConfig(member.guild.id);
            if (!config || !config.welcome || !config.welcome.channelId || !config.welcome.message) {
                return;
            }

            const channel = member.guild.channels.cache.get(config.welcome.channelId);
            if (!channel) return;

            // Identify inviter using inviteTracker utility
            const inviter = await findInviter(member);
            const inviterText = inviter ? `${inviter}` : 'Server / Direct Invite';

            // Replace placeholders
            let formattedMessage = config.welcome.message
                .replace(/{join}/g, `${member}`)
                .replace(/{inviter}/g, inviterText);

            await channel.send(formattedMessage);
        } catch (error) {
            console.error('[guildMemberAdd] Error sending welcome message:', error);
        }
    }
};
