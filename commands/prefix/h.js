const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createEmbed, createErrorEmbed, COLORS } = require('../../utils/embedBuilder');
const { getGuildConfig } = require('../../utils/database');
const { parseAndFormatMentions } = require('../../utils/mentionParser');

// Cooldown map: key = `${guildId}_${userId}`, value = expiration timestamp
const cooldowns = new Map();
const COOLDOWN_SECONDS = 30;

module.exports = {
    name: 'h',
    description: 'שליחת פניית תמיכה עם קטגוריה וסיבה',
    async execute(message, args) {
        const fullInput = args.join(' ').trim();

        if (!fullInput) {
            const errorEmbed = createErrorEmbed(
                'אנא ספק סיבה לבקשת התמיכה שלך.\n' +
                '**שימוש:** `!h <סיבה>` או `!h <קטגוריה> <סיבה>`\n' +
                '**דוגמה:** `!h תמיכה יש לי תקלה בשרת`'
            );
            return message.reply({ embeds: [errorEmbed] });
        }

        // Check 30-second cooldown per user
        const now = Date.now();
        const cooldownKey = `${message.guild.id}_${message.author.id}`;
        if (cooldowns.has(cooldownKey)) {
            const expirationTime = cooldowns.get(cooldownKey);
            if (now < expirationTime) {
                const timeLeft = Math.ceil((expirationTime - now) / 1000);
                const cooldownEmbed = createErrorEmbed(
                    `⏳ **אנא המתן!** ישנו קולדאון בין פניות.\n` +
                    `עליך להמתין עוד **${timeLeft}** שניות לפני שתוכל להשתמש שוב ב-\`!h\`.`
                );
                return message.reply({ embeds: [cooldownEmbed] });
            }
        }

        const knownCategories = ['תמיכה', 'דיווח', 'שאלה', 'תקלה', 'אחר', 'support', 'report', 'other', 'bug'];

        let category = 'תמיכה כללית';
        let reason = fullInput;

        const firstWord = args[0].toLowerCase();
        if (knownCategories.includes(firstWord) && args.length > 1) {
            category = args[0];
            reason = args.slice(1).join(' ');
        }

        const config = getGuildConfig(message.guild.id);
        const template = config.hMessage || "תודה שפנית אלינו! חבר צוות יטפל בבקשתך בהקדם.\n**קטגוריה:** {category}\n**סיבה:** {reason}";

        let formattedMessage = template
            .replace(/{category}/g, category)
            .replace(/{reason}/g, reason)
            .replace(/{server}|{guild}|{servername}/g, message.guild.name)
            .replace(/{user}|{member}/g, `${message.author}`);

        const parsed = parseAndFormatMentions(formattedMessage, message.guild);
        formattedMessage = parsed.formattedText;

        const embed = createEmbed({
            title: `🛠️ פניית תמיכה - ${message.guild.name}`,
            description: formattedMessage,
            color: COLORS.PRIMARY,
            fields: [
                { name: '👤 נשלח על ידי', value: `${message.author} (${message.author.tag})`, inline: true },
                { name: '🏷️ קטגוריה', value: `\`${category}\``, inline: true },
                { name: '📌 סטטוס', value: '⏳ ממתין לטיפול צוות', inline: true },
                { name: '👨‍💼 שוייך ל', value: 'טרם שוייך', inline: true }
            ],
            thumbnail: message.author.displayAvatarURL({ dynamic: true }),
            footerText: `${message.guild.name} • מערכת תמיכה`
        });

        // Add Claim button for staff
        const claimBtn = new ButtonBuilder()
            .setCustomId('h_claim_btn')
            .setLabel('📌 שייך אליי')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(claimBtn);

        const pingContent = parsed.pings.length > 0 ? parsed.pings.join(' ') : undefined;

        await message.reply({
            content: pingContent,
            embeds: [embed],
            components: [row],
            allowedMentions: { parse: ['roles', 'users', 'everyone'] }
        });

        // Set cooldown after successful execution
        cooldowns.set(cooldownKey, now + (COOLDOWN_SECONDS * 1000));
        setTimeout(() => cooldowns.delete(cooldownKey), COOLDOWN_SECONDS * 1000);
    }
};
