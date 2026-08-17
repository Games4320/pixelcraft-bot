const invitesCache = new Map();

/**
 * Cache all current invites for all guilds the client is in
 */
async function initInviteTracker(client) {
    client.guilds.cache.forEach(async (guild) => {
        try {
            const firstInvites = await guild.invites.fetch();
            const codeUses = new Map();
            firstInvites.forEach((inv) => codeUses.set(inv.code, inv.uses));
            invitesCache.set(guild.id, codeUses);
        } catch (err) {
            console.log(`[InviteTracker] Could not fetch invites for guild ${guild.name} (${guild.id}):`, err.message);
        }
    });
}

/**
 * Handle new member join to identify inviter
 * Returns inviter User or null
 */
async function findInviter(member) {
    const { guild } = member;
    try {
        const cachedInvites = invitesCache.get(guild.id) || new Map();
        const newInvites = await guild.invites.fetch();

        let usedInvite = null;
        for (const [code, inv] of newInvites) {
            const cachedUses = cachedInvites.get(code) || 0;
            if (inv.uses > cachedUses) {
                usedInvite = inv;
                break;
            }
        }

        // Update cache with new invite map
        const updatedCache = new Map();
        newInvites.forEach((inv) => updatedCache.set(inv.code, inv.uses));
        invitesCache.set(guild.id, updatedCache);

        return usedInvite ? usedInvite.inviter : null;
    } catch (err) {
        console.error('[InviteTracker] Error matching invite:', err);
        return null;
    }
}

/**
 * Update invite cache on invite create
 */
function onInviteCreate(invite) {
    const cached = invitesCache.get(invite.guild.id) || new Map();
    cached.set(invite.code, invite.uses);
    invitesCache.set(invite.guild.id, cached);
}

/**
 * Update invite cache on invite delete
 */
function onInviteDelete(invite) {
    const cached = invitesCache.get(invite.guild.id);
    if (cached) {
        cached.delete(invite.code);
    }
}

module.exports = {
    initInviteTracker,
    findInviter,
    onInviteCreate,
    onInviteDelete
};
