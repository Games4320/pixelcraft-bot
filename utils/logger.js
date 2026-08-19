const { getGuildConfig } = require('./database');
const { createEmbed, COLORS } = require('./embedBuilder');

/**
 * Fetch configured logs channel for a guild
 */
async function getLogsChannel(guild) {
    if (!guild) return null;
    const config = getGuildConfig(guild.id);
    if (!config.logsChannelId) return null;

    const channel = guild.channels.cache.get(config.logsChannelId) ||
        await guild.channels.fetch(config.logsChannelId).catch(() => null);

    if (!channel || !channel.isTextBased()) return null;
    return channel;
}

/**
 * 1. Log Message Delete
 */
async function logMessageDelete(guild, { author, channel, content, attachments = [] }) {
    const logsChannel = await getLogsChannel(guild);
    if (!logsChannel) return;

    const authorText = author ? `${author} (\`${author.tag}\` • \`${author.id}\`)` : 'משתמש לא ידוע';
    const channelText = channel ? `${channel} (\`#${channel.name}\`)` : 'ערוץ לא ידוע';
    const cleanContent = content ? (content.length > 1000 ? content.slice(0, 1000) + '...' : content) : '*ללא תוכן טקסטואלי*';

    const fields = [
        { name: '👤 נשלח על ידי', value: authorText, inline: true },
        { name: '📁 בערוץ', value: channelText, inline: true },
        { name: '💬 תוכן ההודעה שנמחקה', value: cleanContent, inline: false }
    ];

    if (attachments.length > 0) {
        fields.push({ name: '📎 קבצים מצורפים', value: attachments.join('\n'), inline: false });
    }

    const embed = createEmbed({
        title: '🗑️ הודעה נמחקה',
        color: COLORS.ERROR,
        thumbnail: author?.displayAvatarURL({ dynamic: true }) || null,
        fields,
        footerText: `מערכת לוגים • ${new Date().toLocaleTimeString('he-IL')}`
    });

    await logsChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * 2. Log Message Edit
 */
async function logMessageEdit(guild, { author, channel, oldContent, newContent, messageUrl }) {
    const logsChannel = await getLogsChannel(guild);
    if (!logsChannel) return;

    if (oldContent === newContent) return;

    const authorText = author ? `${author} (\`${author.tag}\` • \`${author.id}\`)` : 'משתמש לא ידוע';
    const channelText = channel ? `${channel} (\`#${channel.name}\`)` : 'ערוץ לא ידוע';
    const cleanOld = oldContent ? (oldContent.length > 800 ? oldContent.slice(0, 800) + '...' : oldContent) : '*ללא תוכן*';
    const cleanNew = newContent ? (newContent.length > 800 ? newContent.slice(0, 800) + '...' : newContent) : '*ללא תוכן*';

    const embed = createEmbed({
        title: '✏️ הודעה נערכה',
        color: COLORS.WARNING,
        thumbnail: author?.displayAvatarURL({ dynamic: true }) || null,
        fields: [
            { name: '👤 נערך על ידי', value: authorText, inline: true },
            { name: '📁 בערוץ', value: channelText, inline: true },
            { name: '📝 לפני העריכה', value: cleanOld, inline: false },
            { name: '✨ אחרי העריכה', value: cleanNew, inline: false }
        ],
        footerText: `מערכת לוגים • ${new Date().toLocaleTimeString('he-IL')}`
    });

    if (messageUrl) {
        embed.setDescription(`[לחץ כאן למעבר להודעה](${messageUrl})`);
    }

    await logsChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * 3. Log Member Join
 */
async function logMemberJoin(guild, member, inviter = null) {
    const logsChannel = await getLogsChannel(guild);
    if (!logsChannel) return;

    const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
    const inviterText = inviter ? `${inviter} (\`${inviter.tag}\`)` : 'לא ידוע / קישור ישיר';

    const embed = createEmbed({
        title: '🚪 חבר חדש הצטרף לשרת',
        description: `ברוך הבא ${member}!`,
        color: COLORS.SUCCESS,
        thumbnail: member.user.displayAvatarURL({ dynamic: true }),
        fields: [
            { name: '👤 משתמש', value: `${member} (\`${member.user.tag}\`)`, inline: true },
            { name: '🆔 מזהה משתמש', value: `\`${member.id}\``, inline: true },
            { name: '📅 גיל המשתמש', value: `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`, inline: false },
            { name: '📩 הוזמן על ידי', value: inviterText, inline: true },
            { name: '👥 סה"כ חברים בשרת', value: `\`${guild.memberCount}\``, inline: true }
        ],
        footerText: `מערכת לוגים • ${new Date().toLocaleTimeString('he-IL')}`
    });

    await logsChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * 4. Log Member Leave
 */
async function logMemberLeave(guild, member) {
    const logsChannel = await getLogsChannel(guild);
    if (!logsChannel) return;

    const joinedTimestamp = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;
    const joinedText = joinedTimestamp ? `<t:${joinedTimestamp}:R>` : 'לא ידוע';

    const embed = createEmbed({
        title: '🚪 חבר עזב את השרת',
        description: `${member.user.tag} עזב את השרת.`,
        color: COLORS.ERROR,
        thumbnail: member.user.displayAvatarURL({ dynamic: true }),
        fields: [
            { name: '👤 משתמש', value: `${member.user.tag} (\`${member.id}\`)`, inline: true },
            { name: '📅 הצטרף לשרת', value: joinedText, inline: true },
            { name: '👥 סה"כ חברים נותרו', value: `\`${guild.memberCount}\``, inline: true }
        ],
        footerText: `מערכת לוגים • ${new Date().toLocaleTimeString('he-IL')}`
    });

    await logsChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * 5. Log Voice State Update
 */
async function logVoiceState(guild, member, type, channelName) {
    const logsChannel = await getLogsChannel(guild);
    if (!logsChannel) return;

    const typeConfig = {
        join: { title: '🎙️ התחבר לשיחה קולית', color: COLORS.SUCCESS, desc: `${member} התחבר לערוץ **${channelName}**` },
        leave: { title: '🔇 התנתק משיחה קולית', color: COLORS.ERROR, desc: `${member} עזב את הערוץ **${channelName}**` },
        switch: { title: '🔄 עבר ערוץ שיחה', color: COLORS.PRIMARY, desc: `${member} עבר לערוץ **${channelName}**` }
    };

    const info = typeConfig[type] || { title: '🎙️ עדכון שיחה קולית', color: COLORS.PRIMARY, desc: `${member}: ${channelName}` };

    const embed = createEmbed({
        title: info.title,
        description: info.desc,
        color: info.color,
        thumbnail: member.user.displayAvatarURL({ dynamic: true }),
        fields: [
            { name: '👤 משתמש', value: `${member} (\`${member.user.tag}\`)`, inline: true },
            { name: '📁 ערוץ', value: `\`${channelName}\``, inline: true }
        ],
        footerText: `מערכת לוגים • ${new Date().toLocaleTimeString('he-IL')}`
    });

    await logsChannel.send({ embeds: [embed] }).catch(() => {});
}

/**
 * 6. Log AutoMod Trigger
 */
async function logAutoMod(guild, { member, channel, reason, content }) {
    const logsChannel = await getLogsChannel(guild);
    if (!logsChannel) return;

    const reasonMap = {
        invite: '🚫 פרסום קישור הזמנה (Anti-Invite)',
        spam: '⏳ הצפת הודעות (Anti-Spam)',
        duplicate_spam: '⚠️ הודעות כפולות (Duplicate Spam)',
        curse: '🤬 שפה פוגענית / קללות (Anti-Curse)'
    };

    const reasonText = reasonMap[reason] || reason;
    const cleanContent = content ? (content.length > 800 ? content.slice(0, 800) + '...' : content) : '*ללא תוכן*';

    const embed = createEmbed({
        title: '🛡️ תפיסת Auto-Mod',
        description: `הודעה נחסמה ונמחקה על ידי מערכת ההגנה האוטומטית.`,
        color: COLORS.ERROR,
        thumbnail: member?.user?.displayAvatarURL({ dynamic: true }) || null,
        fields: [
            { name: '👤 משתמש', value: member ? `${member} (\`${member.user.tag}\`)` : 'לא ידוע', inline: true },
            { name: '📁 בערוץ', value: channel ? `${channel}` : 'לא ידוע', inline: true },
            { name: '📌 סיבת חסימה', value: `**${reasonText}**`, inline: false },
            { name: '💬 תוכן שנחסם', value: `\`\`\`\n${cleanContent}\n\`\`\``, inline: false }
        ],
        footerText: `Auto-Mod • ${new Date().toLocaleTimeString('he-IL')}`
    });

    await logsChannel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = {
    getLogsChannel,
    logMessageDelete,
    logMessageEdit,
    logMemberJoin,
    logMemberLeave,
    logVoiceState,
    logAutoMod
};
