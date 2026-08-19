const { getGuildConfig } = require('../utils/database');
const { findInviter } = require('../utils/inviteTracker');
const { parseAndFormatMentions } = require('../utils/mentionParser');

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

            // Replace placeholders and resolve role mentions
            let formattedMessage = config.welcome.message
                .replace(/{join}|{user}|{member}/g, `${member}`)
                .replace(/{username}/g, member.user.username)
                .replace(/{server}|{guild}/g, member.guild.name)
                .replace(/{inviter}/g, inviterText);

            const { formattedText } = parseAndFormatMentions(formattedMessage, member.guild);

            await channel.send({
                content: formattedText,
                allowedMentions: { parse: ['roles', 'users', 'everyone'] }
            });
        } catch (error) {
            console.error('[guildMemberAdd] Error sending welcome message:', error);
        }
    }
};
