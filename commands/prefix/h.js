const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createEmbed, createErrorEmbed, COLORS } = require('../../utils/embedBuilder');
const { getGuildConfig } = require('../../utils/database');

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
        
        const formattedMessage = template
            .replace(/{category}/g, category)
            .replace(/{reason}/g, reason);

        const embed = createEmbed({
            title: '🛠️ פניית תמיכה חדשה',
            description: formattedMessage,
            color: COLORS.PRIMARY,
            fields: [
                { name: '👤 נשלח על ידי', value: `${message.author} (${message.author.tag})`, inline: true },
                { name: '🏷️ קטגוריה', value: `\`${category}\``, inline: true },
                { name: '📌 סטטוס', value: '⏳ ממתין לטיפול צוות', inline: true },
                { name: '👨‍💼 שוייך ל', value: 'טרם שוייך', inline: true }
            ],
            thumbnail: message.author.displayAvatarURL({ dynamic: true })
        });

        // Add Claim button for staff
        const claimBtn = new ButtonBuilder()
            .setCustomId('h_claim_btn')
            .setLabel('📌 שייך אליי')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(claimBtn);

        await message.reply({ embeds: [embed], components: [row] });
    }
};
