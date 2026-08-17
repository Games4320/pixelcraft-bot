const { 
    SlashCommandBuilder, 
    PermissionFlagsBits 
} = require('discord.js');
const { addXP, deductXP, readDB, writeDB } = require('../../utils/database');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp')
        .setDescription('ניהול XP למשתמשים (למנהלים בלבד)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setDescription('הוספת XP למשתמש')
                .addUserOption(option => option.setName('user').setDescription('המשתמש').setRequired(true))
                .addIntegerOption(option => option.setName('amount').setDescription('כמות ה-XP להוספה').setRequired(true).setMinValue(1))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('take')
                .setDescription('הסרת XP ממשתמש')
                .addUserOption(option => option.setName('user').setDescription('המשתמש').setRequired(true))
                .addIntegerOption(option => option.setName('amount').setDescription('כמות ה-XP להסרה').setRequired(true).setMinValue(1))
        )
        .addSubcommand(subcommand =>
            subcommand.setName('reset')
                .setDescription('איפוס XP למשתמש או לכולם')
                .addStringOption(option => 
                    option.setName('target')
                        .setDescription('למי לאפס? (User ID / everyone)')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        if (subcommand === 'add') {
            const user = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            
            const result = addXP(guildId, user.id, amount);
            await interaction.reply({ 
                embeds: [createSuccessEmbed('הוספת XP הצליחה', `נוספו **${amount}** XP למשתמש ${user}. כעת יש לו **${result.xp}** XP.`)] 
            });

        } else if (subcommand === 'take') {
            const user = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            
            const result = deductXP(guildId, user.id, amount);
            await interaction.reply({ 
                embeds: [createSuccessEmbed('הסרת XP הצליחה', `הוסרו **${amount}** XP מהמשתמש ${user}. כעת נשאר לו **${result.xp}** XP.`)] 
            });

        } else if (subcommand === 'reset') {
            const target = interaction.options.getString('target');
            const db = readDB();

            if (target.toLowerCase() === 'everyone') {
                // Reset everyone in this guild
                let count = 0;
                Object.keys(db.users).forEach(key => {
                    if (key.startsWith(`${guildId}_`)) {
                        db.users[key] = { xp: 0, level: 0 };
                        count++;
                    }
                });
                writeDB(db);
                await interaction.reply({ 
                    embeds: [createSuccessEmbed('איפוס כללי הצליח', `אופסו הנתונים של **${count}** משתמשים בשרת.`)] 
                });
            } else {
                // Try to treat as user ID or mention
                const userId = target.replace(/[<@!>]/g, '');
                const key = `${guildId}_${userId}`;
                
                if (db.users[key]) {
                    db.users[key] = { xp: 0, level: 0 };
                    writeDB(db);
                    await interaction.reply({ 
                        embeds: [createSuccessEmbed('איפוס משתמש הצליח', `ה-XP של <@${userId}> אופס בהצלחה.`)] 
                    });
                } else {
                    await interaction.reply({ 
                        embeds: [createErrorEmbed('משתמש לא נמצא', `לא נמצאו נתונים עבור המשתמש/ID שהוזן.`)] ,
                        ephemeral: true
                    });
                }
            }
        }
    }
};
