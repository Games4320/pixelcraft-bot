const { EmbedBuilder } = require('discord.js');

const COLORS = {
    PRIMARY: 0x8B8FA3, // Muted gray-blue — calm default
    SUCCESS: 0x7BAF8E, // Soft sage green
    WARNING: 0xC9B27C, // Muted sand
    ERROR: 0xC07A7A,   // Soft dusty rose
    INFO: 0x7C9CB5,    // Muted steel blue
    PURPLE: 0x9B8CB5   // Soft lavender
};

/**
 * Creates a standard styled embed
 */
function createEmbed({ title, description, color = COLORS.PRIMARY, fields = [], footerText, thumbnail, author, guild }) {
    const embed = new EmbedBuilder().setColor(color);

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (fields.length > 0) embed.addFields(fields);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (author) embed.setAuthor(author);
    if (footerText) {
        embed.setFooter({ text: footerText });
    } else if (guild && guild.name) {
        embed.setFooter({ text: guild.name, iconURL: guild.iconURL ? guild.iconURL({ dynamic: true }) : undefined });
    }
    // keep embeds light: no timestamps by default, no heavy decoration

    return embed;
}

/**
 * Creates an error embed
 */
function createErrorEmbed(message) {
    return new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setDescription(message);
}

/**
 * Creates a success embed
 */
function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setDescription(title && description ? `**${title}**\n${description}` : (description || title));
}

module.exports = {
    COLORS,
    createEmbed,
    createErrorEmbed,
    createSuccessEmbed
};
