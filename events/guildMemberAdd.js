const { getGuildConfig } = require('../utils/database');
const { findInviter } = require('../utils/inviteTracker');
const { parseAndFormatMentions } = require('../utils/mentionParser');
const { logMemberJoin } = require('../utils/logger');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            const config = getGuildConfig(member.guild.id);

            // 1. Auto-Role Assignment
            if (config.autoRoleId) {
                const autoRole = member.guild.roles.cache.get(config.autoRoleId);
                if (autoRole) {
                    await member.roles.add(autoRole).catch(err => {
                        console.error(`[AutoRole] Could not assign role in ${member.guild.name}:`, err.message);
                    });
                }
            }

            // Identify inviter using inviteTracker utility
            const inviter = await findInviter(member);

            // 2. Log Member Join in Logs Room
            await logMemberJoin(member.guild, member, inviter).catch(() => {});

            // 3. Welcome Message
            if (!config || !config.welcome || !config.welcome.channelId || !config.welcome.message) {
                return;
            }

            const channel = member.guild.channels.cache.get(config.welcome.channelId);
            if (!channel) return;

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
            console.error('[guildMemberAdd] Error processing new member:', error);
        }
    }
};
