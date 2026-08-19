const { createEmbed, createSuccessEmbed, createErrorEmbed, COLORS } = require('../../utils/embedBuilder');
const { getGuildConfig, updateGuildConfig } = require('../../utils/database');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'vt',
    aliases: ['veteran'],
    description: 'בדיקת תאריך הצטרפות לשרת וזכאות לתפקיד וותיק (Veteran / OG)',
    async execute(message, args) {
        // 1. Admin shortcut: !vt set <@role> or !vt set role <@role>
        if (args[0] && args[0].toLowerCase() === 'set') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return message.reply({ embeds: [createErrorEmbed('❌ דרושות הרשאות ניהול שרת כדי להגדיר את תפקיד הוותיק.')] });
            }

            const role = message.mentions.roles.first() ||
                         message.guild.roles.cache.get(args[1]) ||
                         message.guild.roles.cache.get(args[2]) ||
                         message.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(1).join(' ').toLowerCase());

            if (!role) {
                return message.reply({
                    embeds: [createErrorEmbed(
                        'אנא תייג או ספק את ה-ID של התפקיד הרצוי.\n' +
                        '**שימוש:** `!vt set <@role>` או `/veteran set role role:<תפקיד>`\n' +
                        '**דוגמה:** `!vt set @Gold` או `!vt set @OG`'
                    )]
                });
            }

            updateGuildConfig(message.guild.id, 'veteranRoleId', role.id);

            const successEmbed = createSuccessEmbed(
                'תפקיד וותיק עודכן בהצלחה',
                `תפקיד הוותיק עבור **${message.guild.name}** הוגדר לתפקיד **${role}**!\n\n` +
                `מעתה, פקודת \`!vt\` תותאם לשם התפקיד **${role.name}** ותעניק אותו אוטומטית לשחקנים זכאים.`
            );

            return message.reply({ embeds: [successEmbed] });
        }

        const member = message.member;
        if (!member || !member.joinedAt) {
            return message.reply('לא ניתן לקבוע את תאריך ההצטרפות שלך לשרת.');
        }

        const joinDate = member.joinedAt;
        const now = new Date();
        const diffMs = now - joinDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffMonths = (diffMs / (1000 * 60 * 60 * 24 * 30.4375)).toFixed(1);

        // Threshold: 6+ months = ~180 days
        const VETERAN_THRESHOLD_DAYS = 180;
        const qualifies = diffDays >= VETERAN_THRESHOLD_DAYS;

        // Retrieve configured or default role
        const config = getGuildConfig(message.guild.id);
        let veteranRole = null;

        if (config.veteranRoleId) {
            veteranRole = message.guild.roles.cache.get(config.veteranRoleId);
        }

        if (!veteranRole) {
            veteranRole = message.guild.roles.cache.find(
                r => r.name.toUpperCase() === 'VETERAN' ||
                     r.name === 'וותיק' ||
                     r.name === 'ותיק' ||
                     r.name.toUpperCase() === 'OG' ||
                     r.name.toUpperCase() === 'GOLD' ||
                     r.name.toUpperCase() === 'DIAMOND'
            );
        }

        const roleDisplayName = veteranRole ? veteranRole.name : 'וותיק (Veteran)';

        let roleStatusText = 'לא שויך תפקיד';
        if (qualifies) {
            if (veteranRole) {
                if (member.roles.cache.has(veteranRole.id)) {
                    roleStatusText = `✅ כבר יש לך את התפקיד **${veteranRole.name}**!`;
                } else {
                    roleStatusText = `🎖️ אתה זכאי לתפקיד **${veteranRole.name}**!`;
                    try {
                        await member.roles.add(veteranRole);
                        roleStatusText += ' *(התפקיד שויך אליך אוטומטית!)*';
                    } catch (err) {
                        roleStatusText += ' *(פנה לצוות כדי לקבל את התפקיד)*';
                    }
                }
            } else {
                roleStatusText = `✅ אתה זכאי למעמד **${roleDisplayName}**!`;
            }
        } else {
            const daysRemaining = VETERAN_THRESHOLD_DAYS - diffDays;
            roleStatusText = `⏳ עליך להישאר עוד **${daysRemaining} ימים** בשרת כדי לפתוח מעמד ${roleDisplayName}.`;
        }

        const embed = createEmbed({
            title: `🎖️ בדיקת מעמד ${roleDisplayName} - ${message.guild.name}`,
            color: qualifies ? COLORS.SUCCESS : COLORS.WARNING,
            thumbnail: member.user.displayAvatarURL({ dynamic: true }),
            fields: [
                { name: '👤 משתמש', value: `${member.user} (${member.user.tag})`, inline: true },
                { name: '📅 הצטרף לשרת', value: `<t:${Math.floor(joinDate.getTime() / 1000)}:F>\n(<t:${Math.floor(joinDate.getTime() / 1000)}:R>)`, inline: true },
                { name: '⏱️ זמן בשרת', value: `**${diffDays}** ימים (~${diffMonths} חודשים)`, inline: true },
                { name: `🎖️ זכאות ל-${roleDisplayName} (6+ חודשים)`, value: qualifies ? '🟢 **זכאי**' : '🔴 **עדיין לא זכאי**', inline: true },
                { name: '📌 סטטוס תפקיד', value: roleStatusText, inline: false }
            ],
            footerText: `${message.guild.name} Bot • מערכת ${roleDisplayName}`
        });

        await message.reply({ embeds: [embed] });
    }
};
