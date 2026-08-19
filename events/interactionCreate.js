const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    RoleSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionsBitField,
    AttachmentBuilder,
    EmbedBuilder
} = require('discord.js');
const { getGuildConfig, updateGuildConfig, getUserProfile, deductXP } = require('../utils/database');
const { createEmbed, createErrorEmbed, createSuccessEmbed, COLORS } = require('../utils/embedBuilder');
const { activeSetupSessions } = require('../commands/slash/xpshop');
const { parseAndFormatMentions } = require('../utils/mentionParser');
const { handleGiveawayButton } = require('../utils/giveawayManager');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            // 1. Handle Slash Commands
            if (interaction.isChatInputCommand()) {
                const command = client.slashCommands.get(interaction.commandName);
                if (!command) return;

                await command.execute(interaction, client);
                return;
            }

            // 2. Handle Modal Submissions
            if (interaction.isModalSubmit()) {
                if (interaction.customId === 'xpshop_modal_count') {
                    await handleXPShopCountModal(interaction);
                } else if (interaction.customId === 'xpshop_modal_xp_costs') {
                    await handleXPShopCostsModal(interaction);
                } else if (interaction.customId === 'ticket_adduser_modal') {
                    await handleTicketAddUserModal(interaction);
                } else if (interaction.customId === 'ticket_subject_modal') {
                    await handleTicketSubjectModalSubmit(interaction);
                }
                return;
            }

            // 3. Handle Select Menus
            if (interaction.isStringSelectMenu() || interaction.isRoleSelectMenu()) {
                if (interaction.customId === 'ticket_create_menu') {
                    await handleTicketCreateSelect(interaction);
                } else if (interaction.customId === 'xpshop_redeem_select') {
                    await handleXPShopRedeemSelect(interaction);
                } else if (interaction.customId.startsWith('xpshop_select_role_')) {
                    await handleXPShopRoleSelect(interaction);
                }
                return;
            }

            // 4. Handle Buttons
            if (interaction.isButton()) {
                if (interaction.customId === 'h_claim_btn') {
                    await handleHClaimButton(interaction);
                } else if (interaction.customId === 'ticket_close_btn') {
                    await closeTicketChannel(interaction);
                } else if (interaction.customId === 'ticket_claim_btn') {
                    await handleTicketClaim(interaction);
                } else if (interaction.customId === 'ticket_adduser_btn') {
                    await handleTicketAddUserButton(interaction);
                } else if (interaction.customId.startsWith('drop_claim_')) {
                    await handleDropClaim(interaction);
                } else if (interaction.customId === 'giveaway_join_btn') {
                    await handleGiveawayButton(interaction);
                } else if (interaction.customId.startsWith('reactionrole_btn_')) {
                    await handleReactionRoleButton(interaction);
                } else if (interaction.customId === 'xpshop_btn_enter_xp') {
                    await handleXPShopOpenCostsModal(interaction);
                } else if (interaction.customId.startsWith('ticket_subject_btn_')) {
                    await handleTicketSubjectOpenModal(interaction);
                }
                return;
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
            const errorMessage = 'אירעה שגיאה בעת עיבוד הבקשה שלך.';
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: `❌ ${errorMessage}`, ephemeral: true }).catch(() => {});
            } else {
                await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true }).catch(() => {});
            }
        }
    },
    closeTicketChannel
};

// ==========================================
// !H CLAIM BUTTON HANDLER
// ==========================================

async function handleHClaimButton(interaction) {
    const config = getGuildConfig(interaction.guildId);
    const member = interaction.member;

    let isAllowed = false;

    if (config.hClaimRole) {
        // If a specific claim role is configured
        isAllowed = member.roles.cache.has(config.hClaimRole) ||
                    member.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
                    member.permissions.has(PermissionsBitField.Flags.Administrator);
    } else {
        // Default permission check: Staff role or ManageGuild / Admin
        isAllowed = member.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
                    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
                    member.roles.cache.some(r =>
                        r.name.toLowerCase().includes('staff') ||
                        r.name.toLowerCase().includes('admin') ||
                        r.name.toLowerCase().includes('mod') ||
                        r.name.includes('צוות') ||
                        r.name.includes('מנהל')
                    );
    }

    if (!isAllowed) {
        return interaction.reply({
            embeds: [createErrorEmbed('❌ אין לך הרשאה לשייך פנייה זו! רק חברי צוות מורשים יכולים לשייך פניות.')],
            ephemeral: true
        });
    }

    // Get existing message embed
    const messageEmbed = interaction.message.embeds[0];
    if (!messageEmbed) {
        return interaction.reply({ content: '❌ לא ניתן למצוא את פרטי הפנייה.', ephemeral: true });
    }

    // Re-build embed with claimed status
    const updatedEmbed = EmbedBuilder.from(messageEmbed)
        .setColor(COLORS.SUCCESS)
        .setFields(
            messageEmbed.fields.map(field => {
                if (field.name.includes('סטטוס')) {
                    return { name: '📌 סטטוס', value: '🟢 בטיפול צוות', inline: true };
                }
                if (field.name.includes('שוייך ל') || field.name.includes('שויך ל')) {
                    return { name: '👨‍💼 שוייך ל', value: `${interaction.user} (${interaction.user.tag})`, inline: true };
                }
                return field;
            })
        );

    // Disable button
    const disabledBtn = new ButtonBuilder()
        .setCustomId('h_claim_btn')
        .setLabel(`✅ שוייך ל-${interaction.user.username}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

    const row = new ActionRowBuilder().addComponents(disabledBtn);

    await interaction.update({ embeds: [updatedEmbed], components: [row] });
    await interaction.followUp({ content: `✅ הפנייה שוייכה אליך בהצלחה (${interaction.user})!`, ephemeral: true });
}

// ==========================================
// XPSHOP INTERACTION HANDLERS (HEBREW)
// ==========================================

async function handleXPShopCountModal(interaction) {
    const rawCount = interaction.fields.getTextInputValue('xpshop_role_count');
    const count = parseInt(rawCount, 10);

    if (isNaN(count) || count < 1 || count > 5) {
        return interaction.reply({
            embeds: [createErrorEmbed('אנא הזן מספר תפקידים תקין בין 1 ל-5.')],
            ephemeral: true
        });
    }

    activeSetupSessions.set(interaction.guildId, {
        count,
        roles: new Array(count).fill(null)
    });

    const components = [];
    let instructions = `**הגדרת חנות XP (${count} תפקידים)**\n\n`;

    for (let i = 1; i <= count; i++) {
        instructions += `משבצת #${i}: בחר תפקיד למטה\n`;
        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId(`xpshop_select_role_${i}`)
            .setPlaceholder(`בחר תפקיד למשבצת #${i}`);

        components.push(new ActionRowBuilder().addComponents(roleSelect));
    }

    const costsBtn = new ButtonBuilder()
        .setCustomId('xpshop_btn_enter_xp')
        .setLabel('הזן עלויות XP וסיים הגדרה')
        .setStyle(ButtonStyle.Success)
        .setEmoji('⚙️');

    components.push(new ActionRowBuilder().addComponents(costsBtn));

    const embed = createEmbed({
        title: '🛒 פאנל הגדרת חנות XP',
        description: instructions + '\nלאחר בחירת תפקידים לכל המשבצות, לחץ על **הזן עלויות XP וסיים הגדרה**!',
        color: COLORS.PRIMARY
    });

    await interaction.reply({ embeds: [embed], components, ephemeral: true });
}

async function handleXPShopRoleSelect(interaction) {
    const slotIndex = parseInt(interaction.customId.replace('xpshop_select_role_', ''), 10) - 1;
    const selectedRoleId = interaction.values[0];

    const session = activeSetupSessions.get(interaction.guildId);
    if (!session) {
        return interaction.reply({ content: 'הסשן פג תוקף. אנא הרץ שוב את הפקודה `/xpshop setup`.', ephemeral: true });
    }

    session.roles[slotIndex] = selectedRoleId;
    const role = interaction.guild.roles.cache.get(selectedRoleId);

    await interaction.reply({
        content: `✅ משבצת #${slotIndex + 1} הוגדרה לתפקיד **${role ? role.name : selectedRoleId}**`,
        ephemeral: true
    });
}

async function handleXPShopOpenCostsModal(interaction) {
    const session = activeSetupSessions.get(interaction.guildId);
    if (!session) {
        return interaction.reply({ content: 'הסשן פג תוקף. אנא הרץ שוב את הפקודה `/xpshop setup`.', ephemeral: true });
    }

    for (let i = 0; i < session.count; i++) {
        if (!session.roles[i]) {
            return interaction.reply({
                content: `❌ אנא בחר תפקיד עבור משבצת #${i + 1} לפני שתמשיך!`,
                ephemeral: true
            });
        }
    }

    const modal = new ModalBuilder()
        .setCustomId('xpshop_modal_xp_costs')
        .setTitle('חנות XP - הזנת דרישות XP');

    const rows = [];
    for (let i = 0; i < session.count; i++) {
        const role = interaction.guild.roles.cache.get(session.roles[i]);
        const roleName = role ? role.name : `משבצת #${i + 1}`;

        const xpInput = new TextInputBuilder()
            .setCustomId(`xp_cost_${i}`)
            .setLabel(`מחיר XP עבור "${roleName.substring(0, 30)}"` )
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('לדוגמה: 150, 300, 500')
            .setRequired(true);

        rows.push(new ActionRowBuilder().addComponents(xpInput));
    }

    modal.addComponents(rows);
    await interaction.showModal(modal);
}

async function handleXPShopCostsModal(interaction) {
    const session = activeSetupSessions.get(interaction.guildId);
    if (!session) {
        return interaction.reply({ content: 'הסשן פג תוקף. אנא הרץ שוב את הפקודה `/xpshop setup`.', ephemeral: true });
    }

    const shopItems = [];
    for (let i = 0; i < session.count; i++) {
        const rawXP = interaction.fields.getTextInputValue(`xp_cost_${i}`);
        const xpCost = parseInt(rawXP, 10);

        if (isNaN(xpCost) || xpCost <= 0) {
            return interaction.reply({
                embeds: [createErrorEmbed(`מחיר XP לא תקין עבור משבצת #${i + 1}. חייב להיות מספר חיובי.`)],
                ephemeral: true
            });
        }

        shopItems.push({
            roleId: session.roles[i],
            xpCost
        });
    }

    const config = getGuildConfig(interaction.guildId);
    let currentShop = config.xpshop || [];

    for (const newItem of shopItems) {
        const existingIdx = currentShop.findIndex(i => i.roleId === newItem.roleId);
        if (existingIdx !== -1) {
            currentShop[existingIdx].xpCost = newItem.xpCost;
        } else if (currentShop.length < 20) {
            currentShop.push(newItem);
        }
    }

    updateGuildConfig(interaction.guildId, 'xpshop', currentShop);
    activeSetupSessions.delete(interaction.guildId);

    const embedList = currentShop.map((item, idx) => {
        const role = interaction.guild.roles.cache.get(item.roleId);
        return `**${idx + 1}.** ${role ? `<@&${role.id}>` : item.roleId} — **${item.xpCost} XP**`;
    }).join('\n');

    const successEmbed = createSuccessEmbed(
        'חנות ה-XP עודכנה בהצלחה!',
        `חנות התפקידים נשמרה בהצלחה עם **${currentShop.length}/20** תפקידים:\n\n${embedList}\n\n` +
        `חברי השרת יכולים לצפות ולממש תפקידים באמצעות \`/xpshop view\`!`
    );

    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
}

async function handleXPShopRedeemSelect(interaction) {
    const selectedRoleId = interaction.values[0];
    const config = getGuildConfig(interaction.guildId);
    const shop = config.xpshop || [];

    const shopItem = shop.find(item => item.roleId === selectedRoleId);
    if (!shopItem) {
        return interaction.reply({ content: '❌ התפקיד שנבחר אינו זמין יותר בחנות.', ephemeral: true });
    }

    const member = interaction.member;
    const role = interaction.guild.roles.cache.get(selectedRoleId);

    if (!role) {
        return interaction.reply({ content: '❌ התפקיד המשויך לפריט זה אינו קיים יותר בשרת.', ephemeral: true });
    }

    if (member.roles.cache.has(selectedRoleId)) {
        return interaction.reply({
            embeds: [createErrorEmbed(`כבר יש לך את התפקיד **${role.name}**!`)],
            ephemeral: true
        });
    }

    const userProfile = getUserProfile(interaction.guildId, member.id);
    if (userProfile.xp < shopItem.xpCost) {
        const needed = shopItem.xpCost - userProfile.xp;
        return interaction.reply({
            embeds: [createErrorEmbed(`אין לך מספיק XP כדי לממש את **${role.name}**!\n\n**מחיר נדרש:** ${shopItem.xpCost} XP\n**ה-XP שלך:** ${userProfile.xp} XP\n**חסר לך:** ${needed} XP`)],
            ephemeral: true
        });
    }

    try {
        await member.roles.add(role);
        deductXP(interaction.guildId, member.id, shopItem.xpCost);

        const newProfile = getUserProfile(interaction.guildId, member.id);

        const successEmbed = createEmbed({
            title: '🎉 תפקיד מומש בהצלחה!',
            description: `ברכות ${member}! פתחת וקיבלת את התפקיד **${role.name}**!`,
            color: COLORS.SUCCESS,
            fields: [
                { name: 'תפקיד שנתקבל', value: `${role}`, inline: true },
                { name: 'מחיר XP', value: `-${shopItem.xpCost} XP`, inline: true },
                { name: 'XP שנשאר', value: `${newProfile.xp} XP`, inline: true }
            ]
        });

        await interaction.reply({ embeds: [successEmbed] });
    } catch (err) {
        console.error('Error assigning XP shop role:', err);
        await interaction.reply({
            embeds: [createErrorEmbed('נכשל בשיוך התפקיד. ודא שלבוט יש הרשאות מתאימות והתפקיד שלו נמצא מעל התפקיד בחנות!')],
            ephemeral: true
        });
    }
}

// ==========================================
// TICKET SYSTEM HANDLERS (HEBREW)
// ==========================================

async function handleTicketCreateSelect(interaction) {
    const category = interaction.values[0];
    const guild = interaction.guild;
    const user = interaction.user;

    const config = getGuildConfig(interaction.guildId);
    const customSubjects = config.ticketSubjects || [];

    let categoryLabel = category;
    let customSub = null;

    if (category.startsWith('custom_')) {
        customSub = customSubjects.find(s => s.value === category);
        if (customSub) {
            categoryLabel = customSub.name;
        }
    } else {
        const categoryNames = {
            support: 'תמיכה',
            report: 'דיווח',
            staff_app: 'בחינה לצוות',
            other: 'אחר'
        };
        categoryLabel = categoryNames[category] || category;
    }

    // 1. Check if user ALREADY has an open ticket in the server (limit to 1 ticket per user)
    const sanitizedUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existingTicket = guild.channels.cache.find(c => {
        if (c.type !== ChannelType.GuildText || !c.name.startsWith('ticket-')) return false;

        // Check if channel topic contains user ID
        if (c.topic && c.topic.includes(user.id)) return true;

        // Check if this specific user has explicit ViewChannel permissions
        const userOverwrite = c.permissionOverwrites.cache.get(user.id);
        if (userOverwrite && userOverwrite.allow.has(PermissionsBitField.Flags.ViewChannel)) {
            return true;
        }

        // Fallback: match channel name suffix
        if (sanitizedUsername && c.name.endsWith(`-${sanitizedUsername}`)) return true;
        if (c.name.endsWith(`-${user.id}`)) return true;

        return false;
    });

    if (existingTicket) {
        return interaction.reply({
            embeds: [createErrorEmbed(`❌ כבר יש לך טיקט פתוח בשרת (${existingTicket})!\nלא ניתן לפתוח יותר מטיקט אחד בו-זמנית. יש לסגור את הטיקט הקיים לפני פתיחת טיקט חדש.`)],
            ephemeral: true
        });
    }

    let ticketCategoryChannel = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && (c.name.toUpperCase() === 'TICKETS' || c.name === 'טיקטים')
    );

    if (!ticketCategoryChannel) {
        try {
            ticketCategoryChannel = await guild.channels.create({
                name: 'טיקטים',
                type: ChannelType.GuildCategory
            });
        } catch (err) {
            console.error('Failed to create TICKETS category:', err);
        }
    }

    const channelSuffix = sanitizedUsername ? sanitizedUsername.slice(0, 15) : user.id.slice(-6);
    const channelName = `ticket-${category}-${channelSuffix}`;

    const permissionOverwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
            id: user.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.ReadMessageHistory
            ]
        }
    ];

    const staffRoles = guild.roles.cache.filter(r =>
        r.name.toLowerCase().includes('staff') ||
        r.name.toLowerCase().includes('admin') ||
        r.name.toLowerCase().includes('mod') ||
        r.name.includes('צוות') ||
        r.name.includes('מנהל')
    );

    staffRoles.forEach(role => {
        permissionOverwrites.push({
            id: role.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.ManageMessages
            ]
        });
    });

    try {
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            topic: `טיקט של: ${user.tag} (${user.id}) | קטגוריה: ${categoryLabel}`,
            parent: ticketCategoryChannel ? ticketCategoryChannel.id : null,
            permissionOverwrites
        });

        const config = getGuildConfig(interaction.guildId);

        let ticketDescription = '';
        if (config.ticketMessage) {
            ticketDescription = config.ticketMessage
                .replace(/{user}|{member}/g, `${user}`)
                .replace(/{username}/g, user.username)
                .replace(/{server}|{guild}|{servername}/g, guild.name)
                .replace(/{category}/g, categoryLabel);
        } else if (category === 'staff_app') {
            ticketDescription = `שלום ${user}! ברוך הבא לטיקט **בחינה והגשת מועמדות לצוות השרת** 📝\n\n` +
                                `אנא ענה על השאלות הבאות בהודעה אחת מפורטת:\n` +
                                `1️⃣ **שם מלא וגיל:**\n` +
                                `2️⃣ **ניסיון קודם בתפקידי צוות / ניהול בשרתי דיסקורד או משחק:**\n` +
                                `3️⃣ **למה דווקא אתה מתאים לצוות שלנו?**\n` +
                                `4️⃣ **כמה שעות פעילות תוכל להקדיש לשרת ביום/בשבוע?**\n\n` +
                                `צוות ההנהלה יעבור על תשובותיך ויחזור אליך בהקדם!`;
        } else if (category === 'report') {
            ticketDescription = `שלום ${user}! ברוך הבא לטיקט **דיווח על שחקן / תקלה** 🚨\n\n` +
                                `אנא שלח את פרטי הדיווח:\n` +
                                `• על מי/מה הדיווח?\n` +
                                `• מה קרה ובאיזו שעה?\n` +
                                `• הוכחות (תמונות, סרטונים, קישורים וכד').\n\n` +
                                `צוות השרת יבדוק את המקרה בהקדם!`;
        } else if (category.startsWith('custom_')) {
            if (customSub) {
                ticketDescription = `שלום ${user}! ברוך הבא לטיקט **${customSub.name}** ${customSub.emoji ? customSub.emoji : '🎫'}\n\n` +
                                    `${customSub.description}`;
            } else {
                ticketDescription = `שלום ${user}! ברוך הבא לטיקט התמיכה שלך בשרת **${guild.name}**.\n\n` +
                                    `צוות השרת קיבל הודעה ויעזור לך בהקדם. אנא תאר את פנייתך או בעייתך בפירוט למטה.`;
            }
        } else {
            ticketDescription = `שלום ${user}! ברוך הבא לטיקט התמיכה שלך בשרת **${guild.name}**.\n\n` +
                                `צוות השרת קיבל הודעה ויעזור לך בהקדם. אנא תאר את פנייתך או בעייתך בפירוט למטה.`;
        }

        // Resolve any role mentions (e.g. @Staff, @high-staff, {staff}) to valid Discord tags
        const parsed = parseAndFormatMentions(ticketDescription, guild);
        ticketDescription = parsed.formattedText;

        const embed = createEmbed({
            title: `🎫 פניית טיקט (${categoryLabel}) - ${guild.name}`,
            description: ticketDescription,
            color: category === 'staff_app' ? COLORS.SECONDARY || COLORS.PRIMARY : COLORS.PRIMARY,
            fields: [
                { name: '🏷️ קטגוריה', value: `\`${categoryLabel}\``, inline: true },
                { name: '👤 נפתח על ידי', value: `${user} (${user.tag})`, inline: true }
            ],
            footerText: `${guild.name} • לחץ על "סגור טיקט" כאשר הפנייה תטופל.`
        });

        const closeBtn = new ButtonBuilder()
            .setCustomId('ticket_close_btn')
            .setLabel('סגור טיקט')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒');

        const claimBtn = new ButtonBuilder()
            .setCustomId('ticket_claim_btn')
            .setLabel('קבל טיקט (Claim)')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🙋‍♂️');

        const addUserBtn = new ButtonBuilder()
            .setCustomId('ticket_adduser_btn')
            .setLabel('הוספת משתמש')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👤');

        const row = new ActionRowBuilder().addComponents(closeBtn, claimBtn, addUserBtn);

        // Include role pings in content so Discord triggers notifications for staff without duplicating user ping
        const rolePings = parsed.pings.filter(p => p !== user.toString() && p !== `<@!${user.id}>`);
        const contentMessage = rolePings.length > 0 ? rolePings.join(' ') : undefined;

        await ticketChannel.send({
            content: contentMessage,
            embeds: [embed],
            components: [row],
            allowedMentions: { parse: ['roles', 'users', 'everyone'] }
        });

        await interaction.reply({
            content: `✅ הטיקט נוצר בהצלחה! היכנס לערוץ ${ticketChannel}`,
            ephemeral: true
        });
    } catch (err) {
        console.error('Failed to create ticket channel:', err);
        await interaction.reply({
            embeds: [createErrorEmbed('נכשל ביצירת ערוץ הטיקט. אנא בדוק את הרשאות הבוט.')],
            ephemeral: true
        });
    }
}

async function closeTicketChannel(interaction) {
    const channel = interaction.channel;

    if (!channel || !channel.name.startsWith('ticket-')) {
        return interaction.reply({
            content: '❌ ניתן להשתמש בפקודה זו רק בתוך ערוץ טיקט פעיל!',
            ephemeral: true
        });
    }

    await interaction.reply({ content: '🔒 סוגר את הטיקט ומפיק תמליל שיחה (Transcript)...', ephemeral: false });

    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        const sortedMessages = Array.from(messages.values()).reverse();

        let transcriptText = `====================================================\n`;
        transcriptText += `תמליל שיחת טיקט: #${channel.name}\n`;
        transcriptText += `שרת: ${interaction.guild.name} (${interaction.guild.id})\n`;
        transcriptText += `נסגר על ידי: ${interaction.user.tag} (${interaction.user.id})\n`;
        transcriptText += `תאריך הפקה: ${new Date().toISOString()}\n`;
        transcriptText += `====================================================\n\n`;

        sortedMessages.forEach(msg => {
            const timeStr = new Date(msg.createdTimestamp).toLocaleString();
            const content = msg.cleanContent || (msg.embeds.length > 0 ? '[תוכן Embed]' : '[קובץ מצורף]');
            transcriptText += `[${timeStr}] ${msg.author.tag}: ${content}\n`;
        });

        const transcriptBuffer = Buffer.from(transcriptText, 'utf-8');
        const attachment = new AttachmentBuilder(transcriptBuffer, { name: `transcript-${channel.name}.txt` });

        try {
            await interaction.user.send({
                content: `📄 להלן תמליל השיחה עבור הטיקט **#${channel.name}** בשרת **${interaction.guild.name}**:`,
                files: [attachment]
            });
        } catch (dmErr) {
            console.log('Could not send DM transcript to user:', dmErr.message);
        }

        const countdownEmbed = createEmbed({
            title: '🔒 הטיקט נסגר',
            description: 'תמליל השיחה הופק בהצלחה. ערוץ זה יימחק בעוד **5 שניות**.',
            color: COLORS.ERROR
        });

        await channel.send({ embeds: [countdownEmbed], files: [attachment] });

        setTimeout(async () => {
            await channel.delete().catch(() => {});
        }, 5000);
    } catch (err) {
        console.error('Error closing ticket channel:', err);
        await channel.send('❌ אירעה שגיאה בעת סגירת ערוץ הטיקט.');
    }
}

// ==========================================
// TICKET CLAIM & ADD USER HANDLERS
// ==========================================

async function handleTicketClaim(interaction) {
    const member = interaction.member;
    const guild = interaction.guild;
    const channel = interaction.channel;

    // Check if member is staff
    const isStaff = member.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
                    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
                    member.roles.cache.some(r =>
                        r.name.toLowerCase().includes('staff') ||
                        r.name.toLowerCase().includes('admin') ||
                        r.name.toLowerCase().includes('mod') ||
                        r.name.includes('צוות') ||
                        r.name.includes('מנהל')
                    );

    if (!isStaff) {
        return interaction.reply({
            content: '❌ רק אנשי צוות יכולים לקחת בעלות על טיקטים.',
            ephemeral: true
        });
    }

    const messageEmbed = interaction.message.embeds[0];
    const creatorField = messageEmbed.fields.find(f => f.name.includes('נפתח על ידי'));
    const creatorId = creatorField ? creatorField.value.match(/<@!?(\d+)>/)?.[1] : null;

    const staffRoles = guild.roles.cache.filter(r =>
        r.name.toLowerCase().includes('staff') ||
        r.name.toLowerCase().includes('admin') ||
        r.name.toLowerCase().includes('mod') ||
        r.name.includes('צוות') ||
        r.name.includes('מנהל')
    );

    const overwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
            id: member.id, // The claimer
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.ManageMessages
            ]
        }
    ];

    if (creatorId) {
        overwrites.push({
            id: creatorId,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.ReadMessageHistory
            ]
        });
    }

    staffRoles.forEach(role => {
        overwrites.push({
            id: role.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
            deny: [PermissionsBitField.Flags.SendMessages]
        });
    });

    try {
        await channel.permissionOverwrites.set(overwrites);

        const updatedEmbed = EmbedBuilder.from(messageEmbed)
            .addFields({ name: '👨‍💼 מטופל על ידי', value: `${member}`, inline: true });

        const closeBtn = ButtonBuilder.from(interaction.message.components[0].components[0]);
        const claimBtn = ButtonBuilder.from(interaction.message.components[0].components[1])
            .setLabel(`טופל על ידי ${member.user.username}`)
            .setDisabled(true);
        const addUserBtn = ButtonBuilder.from(interaction.message.components[0].components[2]);

        const row = new ActionRowBuilder().addComponents(closeBtn, claimBtn, addUserBtn);

        await interaction.update({ embeds: [updatedEmbed], components: [row] });
        await interaction.followUp({ content: `✅ הטיקט שוייך אליך בהצלחה! כעת רק אתה ופותח הטיקט יכולים לשלוח הודעות.`, ephemeral: true });
    } catch (err) {
        console.error('Error claiming ticket:', err);
        await interaction.reply({ content: '❌ אירעה שגיאה בעת שיוך הטיקט. וודא שיש לבוט הרשאות לניהול ערוצים.', ephemeral: true });
    }
}

async function handleTicketAddUserButton(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('ticket_adduser_modal')
        .setTitle('הוספת משתמש לטיקט');

    const userIdInput = new TextInputBuilder()
        .setCustomId('ticket_user_id')
        .setLabel('מזהה משתמש (User ID)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('הכנס את ה-ID של המשתמש שברצונך להוסיף')
        .setRequired(true);

    const row = new ActionRowBuilder().addComponents(userIdInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
}

async function handleTicketAddUserModal(interaction) {
    const userId = interaction.fields.getTextInputValue('ticket_user_id');
    const channel = interaction.channel;

    try {
        const userToAdd = await interaction.guild.members.fetch(userId);
        if (!userToAdd) throw new Error('User not found');

        await channel.permissionOverwrites.edit(userToAdd.id, {
            ViewChannel: true,
            SendMessages: true,
            AttachFiles: true,
            EmbedLinks: true,
            ReadMessageHistory: true
        });

        await interaction.reply({
            content: `✅ המשתמש ${userToAdd} (ID: ${userId}) נוסף לטיקט בהצלחה!`,
            ephemeral: false
        });
    } catch (error) {
        await interaction.reply({
            content: `❌ לא הצלחתי למצוא משתמש עם ה-ID: \`${userId}\`. וודא שה-ID תקין והמשתמש נמצא בשרת.`,
            ephemeral: true
        });
    }
}

// ==========================================
// DROP SYSTEM HANDLER
// ==========================================

async function handleDropClaim(interaction) {
    const messageEmbed = interaction.message.embeds[0];
    if (!messageEmbed) return;

    // Extract prize from description (it's inside the # header)
    const prizeMatch = messageEmbed.description.match(/# (.*)/);
    const prize = prizeMatch ? prizeMatch[1] : "פרס";

    // Re-build embed to show it's ended
    const updatedEmbed = EmbedBuilder.from(messageEmbed)
        .setTitle('🎁 הדרופ הסתיים!')
        .setDescription(`**הדרופ נגמר!**\n\n**הפרס:** ${prize}\n**הזוכה המאושר:** ${interaction.user}`)
        .setColor(COLORS.ERROR);

    // Disable button
    const disabledBtn = new ButtonBuilder()
        .setCustomId(interaction.customId)
        .setLabel('הדרופ הסתיים 🏁')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

    const row = new ActionRowBuilder().addComponents(disabledBtn);

    await interaction.update({ embeds: [updatedEmbed], components: [row] });

    // Announce winner
    await interaction.channel.send({
        content: `🎊 **מזל טוב!** ${interaction.user} זכה ב: **${prize}**`
    });
}

// ==========================================
// REACTION ROLE SYSTEM HANDLER
// ==========================================

async function handleReactionRoleButton(interaction) {
    const roleId = interaction.customId.replace('reactionrole_btn_', '');
    const role = interaction.guild.roles.cache.get(roleId) || await interaction.guild.roles.fetch(roleId).catch(() => null);

    if (!role) {
        return interaction.reply({ content: '❌ התפקיד המשויך לכפתור זה אינו קיים יותר בשרת.', ephemeral: true });
    }

    const member = interaction.member;
    try {
        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            return interaction.reply({ content: `❌ התפקיד **${role.name}** הוסר ממך בהצלחה.`, ephemeral: true });
        } else {
            await member.roles.add(role);
            return interaction.reply({ content: `✅ קיבלת את התפקיד **${role.name}** בהצלחה! 🎉`, ephemeral: true });
        }
    } catch (err) {
        console.error('Error toggling reaction role:', err);
        return interaction.reply({ content: '❌ נכשל בעדכון התפקיד. וודא שלבוט יש הרשאות **ניהול תפקידים (Manage Roles)** ושהרול שלו נמצא מעל התפקיד המבוקש בהיררכיה!', ephemeral: true });
    }
}

// ==========================================
// TICKET CUSTOM SUBJECTS SETUP HANDLERS
// ==========================================

const { activeSubjectSetupSessions } = require('../commands/slash/ticket');

async function handleTicketSubjectOpenModal(interaction) {
    const step = parseInt(interaction.customId.replace('ticket_subject_btn_', ''), 10);
    const session = activeSubjectSetupSessions.get(interaction.guildId);

    if (!session) {
        return interaction.reply({ content: '❌ הסשן פג תוקף. אנא הרץ שוב את הפקודה `/ticket subjects`.', ephemeral: true });
    }

    const modal = new ModalBuilder()
        .setCustomId('ticket_subject_modal')
        .setTitle(`הגדרת נושא #${step} מתוך ${session.amount}`);

    const nameInput = new TextInputBuilder()
        .setCustomId('ticket_subject_name')
        .setLabel(`שם הנושא #${step} (לדוגמה: תמיכה טכנית)`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(25);

    const descInput = new TextInputBuilder()
        .setCustomId('ticket_subject_desc')
        .setLabel(`תיאור הנושא #${step}`)
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(100);

    const emojiInput = new TextInputBuilder()
        .setCustomId('ticket_subject_emoji')
        .setLabel(`אימוג'י לנושא #${step} (אופציונלי, למשל 🛠️)`)
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(5);

    modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(emojiInput)
    );

    await interaction.showModal(modal);
}

async function handleTicketSubjectModalSubmit(interaction) {
    const session = activeSubjectSetupSessions.get(interaction.guildId);

    if (!session) {
        return interaction.reply({ content: '❌ הסשן פג תוקף. אנא הרץ שוב את הפקודה `/ticket subjects`.', ephemeral: true });
    }

    const name = interaction.fields.getTextInputValue('ticket_subject_name').trim();
    const description = interaction.fields.getTextInputValue('ticket_subject_desc').trim();
    const emoji = interaction.fields.getTextInputValue('ticket_subject_emoji').trim() || null;

    const step = session.currentStep;
    session.subjects.push({
        name,
        description,
        emoji,
        value: `custom_${step}`
    });

    if (step < session.amount) {
        session.currentStep++;
        const nextStep = session.currentStep;

        const embed = createEmbed({
            title: '🎫 אשף הגדרת נושאי טיקטים',
            description: `✅ **נושא #${step}** הוגדר בהצלחה!\n` +
                         `• **שם:** ${name}\n` +
                         `• **תיאור:** ${description}\n` +
                         `${emoji ? `• **אימוג'י:** ${emoji}\n` : ''}\n` +
                         `לחץ על הכפתור למטה כדי להמשיך להגדרת **נושא #${nextStep}**.`,
            color: COLORS.PRIMARY
        });

        const nextBtn = new ButtonBuilder()
            .setCustomId(`ticket_subject_btn_${nextStep}`)
            .setLabel(`המשך להגדרת נושא #${nextStep} ⚙️`)
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(nextBtn);

        await interaction.update({ embeds: [embed], components: [row] });
    } else {
        // All subjects configured! Save to database.
        updateGuildConfig(interaction.guildId, 'ticketSubjects', session.subjects);
        activeSubjectSetupSessions.delete(interaction.guildId);

        let listText = '';
        session.subjects.forEach((sub, idx) => {
            listText += `**${idx + 1}.** ${sub.emoji ? sub.emoji + ' ' : ''}**${sub.name}**\n` +
                        `└ *${sub.description}*\n\n`;
        });

        const successEmbed = createSuccessEmbed(
            'נושאי הטיקטים עודכנו בהצלחה! 🎉',
            `הגדרת בהצלחה **${session.amount}** נושאי טיקטים מותאמים אישית:\n\n${listText}` +
            `מעתה, שליחת פאנל הטיקטים באמצעות \`/ticket panel\` תציג נושאים אלו!`
        );

        await interaction.update({ embeds: [successEmbed], components: [] });
    }
}

