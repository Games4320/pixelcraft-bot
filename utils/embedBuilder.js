const { EmbedBuilder } = require('discord.js');

const COLORS = {
    PRIMARY: 0x5865F2, // Discord Blurple
    SUCCESS: 0x57F287, // Emerald Green
    WARNING: 0xFEE75C, // Gold Yellow
    ERROR: 0xED4245,   // Crimson Red
    INFO: 0x3498DB,    // Ice Blue
    PURPLE: 0x9B59B6   // Elegant Purple
};

/**
 * Creates a standard styled embed
 */
function createEmbed({ title, description, color = COLORS.PRIMARY, fields = [], footerText, thumbnail, author }) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTimestamp();

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (fields.length > 0) embed.addFields(fields);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (author) embed.setAuthor(author);
    if (footerText) {
        embed.setFooter({ text: footerText });
    } else {
        embed.setFooter({ text: 'בוט בירזיה • Birzia Bot' });
    }

    return embed;
}

/**
 * Creates an error embed
 */
function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle('❌ שגיאה')
        .setDescription(message)
        .setTimestamp();
}

/**
 * Creates a success embed
 */
function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setTimestamp();
}

module.exports = {
    COLORS,
    createEmbed,
    createErrorEmbed,
    createSuccessEmbed
};
