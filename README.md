# Discord Multi-Purpose Community Bot

A production-ready, feature-rich public Discord bot designed for gaming communities and public servers with dynamic per-server adaptability.

## 🌟 Key Features

### 1. 🛡️ Auto-Mod Protection

- **Anti-Invite:** Automatically intercepts and deletes Discord invite links sent by non-staff members.
- **Anti-Spam:** Rate-limits fast message flooding (>5 messages in 4s) and duplicate spam.
- **Anti-Curse:** Filters severe profanities and slurs in Hebrew and English.
- **Staff Bypass:** Automatic bypass for users with Manage Messages / Manage Server permissions.

### 2. 🎭 Reaction Roles Panel

- `/reactionroles panel` — Create interactive role panels with styled buttons (supporting up to 5 self-assignable roles per panel).
- Instant toggle (add/remove) with ephemeral confirmation feedback.

### 3. 🏆 Leaderboard System

- `!lb`, `!top`, `/leaderboard` — Displays top 10 users ranked by XP & Level with medals (🥇 🥈 🥉) and caller's ranking position.

### 4. 🛒 Expanded XP Role Shop (Up to 20 Roles)

- `/xpshop add role:<role> xp_cost:<cost>` — Add/update shop items directly.
- `/xpshop remove role:<role>` — Remove a role from the shop.
- `/xpshop clear` — Reset the shop.
- `/xpshop view` — Member interactive redeem select menu.
- `/xpshop setup` — Interactive configuration wizard.

### 5. 🎫 Ticket & Support System

- `/ticket panel` / `/ticket setup` — Category dropdown select menu.
- `/ticket set message message:<text>` — Custom opening message supporting dynamic variables (`{user}`, `{server}`, `{category}`) and role mentions (`@Staff`, `@high-staff`).
- `/ticket close` — Automatic transcript generation (.txt) delivered via DM.
- Buttons: Claim Ticket and Add User by ID.

### 6. 🎁 Giveaway System

- `/giveaway create time:<time> winners:<count> prize:<prize>` — Interactive button giveaways.
- `/giveaway reroll message_id:<id>` & `/reroll message_id:<id>` — Re-pick winners.
- `/giveaway end message_id:<id>` — Early finish.
- Resilient persistence across bot restarts.

### 7. 📊 User Status & Metrics

- `/status [user]` / `!status [@user]` — Detailed report: Messages sent, Voice duration, XP & Level, Highest Role, Time in Server, and Invites count.

### 8. 🧹 Message Moderation

- `/clear message_amount:<count> [user]` / `!clear <count>` — Bulk message purge up to 100 messages.

### 9. 🎮 Dynamic Server IP & Version

- `/ip set ip server_ip:<ip>` / `!ip` — Custom Minecraft server IP per guild.
- `/version set version version:<version>` / `!version` — Custom supported game version per guild.

### 10. 🎖️ Custom Veteran / OG Role

- `/veteran set role role:<role>` — Custom veteran role (Gold, Diamond, OG, etc.) dynamically adapting `!vt`.

### 11. 🌐 100% Dynamic Public Bot

- Automatic per-server bot nickname (`[Server Name] Bot`).
- Dynamic presence (`Playing {serverCount} servers`).
- Dynamic contextual embeds across all servers.
