const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('drop')
        .setDescription('יצירת דרופ - הראשון שלוחץ זוכה!')
        .addStringOption(option => 
            option.setName('prize')
                .setDescription('מהו הפרס?')
                .setRequired(true)
        ),
    async execute(interaction) {
        const prize = interaction.options.getString('prize');

        const embed = createEmbed({
            title: '🎁 דרופ חדש!',
            description: `**הראשון שלוחץ על הכפתור למטה זוכה ב:**\n\n# ${prize}\n\nמהרו ללחוץ! ⚡`,
            color: COLORS.SUCCESS,
            footerText: 'מערכת דרופים'
        });

        const claimBtn = new ButtonBuilder()
            .setCustomId(`drop_claim_${Date.now()}`) // Unique ID per drop
            .setLabel('לחץ כדי לזכות! 🏆')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(claimBtn);

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
