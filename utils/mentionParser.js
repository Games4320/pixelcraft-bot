/**
 * Parses and formats role and user mentions in strings for Discord messages
 * Resolves @RoleName, {staff}, {highstaff}, etc. to <@&ROLE_ID>
 * and extracts all pings to be placed in message content so Discord triggers notifications.
 */

function parseAndFormatMentions(text, guild) {
    if (!text || typeof text !== 'string') {
        return { formattedText: text || '', pings: [] };
    }

    let formatted = text;

    if (guild && guild.roles && guild.roles.cache) {
        const allRoles = Array.from(guild.roles.cache.values())
            .filter(r => r.name && r.name !== '@everyone')
            .sort((a, b) => b.name.length - a.name.length); // match longest role names first

        // 1. Resolve convenience placeholders: {staff}, {highstaff}, {high-staff}, {admin}
        formatted = formatted.replace(/{high[-_]?staff}/gi, () => {
            const r = allRoles.find(role =>
                (role.name.toLowerCase().includes('high') && role.name.toLowerCase().includes('staff')) ||
                role.name.includes('הנהלה') ||
                role.name.toLowerCase().includes('senior')
            );
            return r ? `<@&${r.id}>` : '{high-staff}';
        });

        formatted = formatted.replace(/{staff(?:role)?}/gi, () => {
            const r = allRoles.find(role => role.name.toLowerCase() === 'staff') ||
                      allRoles.find(role => !role.name.toLowerCase().includes('high') && role.name.toLowerCase().includes('staff')) ||
                      allRoles.find(role => role.name.includes('צוות') || role.name.toLowerCase().includes('mod')) ||
                      allRoles.find(role => role.name.toLowerCase().includes('staff'));
            return r ? `<@&${r.id}>` : '{staff}';
        });

        formatted = formatted.replace(/{admin(?:role)?}/gi, () => {
            const r = allRoles.find(role =>
                role.name.toLowerCase().includes('admin') ||
                role.name.includes('מנהל')
            );
            return r ? `<@&${r.id}>` : '{admin}';
        });

        // 2. Resolve @RoleName (e.g. @Staff, @High-Staff, @צוות, @Admin, @high staff)
        for (const role of allRoles) {
            const rawName = role.name;
            const escapedName = rawName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Exact @RoleName match (handles spaces, dashes, etc.)
            const exactRegex = new RegExp(`@${escapedName}\\b`, 'gi');
            if (exactRegex.test(formatted)) {
                formatted = formatted.replace(exactRegex, `<@&${role.id}>`);
            }

            // Also check variation where spaces are replaced by dashes or vice-versa
            const withDashes = rawName.replace(/\s+/g, '-');
            const withSpaces = rawName.replace(/[-_]+/g, ' ');

            if (withDashes !== rawName) {
                const dashRegex = new RegExp(`@${withDashes.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                if (dashRegex.test(formatted)) {
                    formatted = formatted.replace(dashRegex, `<@&${role.id}>`);
                }
            }

            if (withSpaces !== rawName) {
                const spaceRegex = new RegExp(`@${withSpaces.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                if (spaceRegex.test(formatted)) {
                    formatted = formatted.replace(spaceRegex, `<@&${role.id}>`);
                }
            }
        }
    }

    // Extract all role mentions, user mentions, @everyone, @here
    const mentionMatches = formatted.match(/<@&?\d+>|@everyone|@here/g) || [];
    const uniquePings = [...new Set(mentionMatches)];

    return {
        formattedText: formatted,
        pings: uniquePings
    };
}

module.exports = {
    parseAndFormatMentions
};
