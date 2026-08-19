const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'help1',
    description: 'מציג את רשימת פקודות הבוט',
    async execute(message) {
        const prefixCommandsField = [
            '`!status [@משתמש]` — הצגת סטטוס מפורט (הודעות, שיחות, XP, תפקיד, ותק, הזמנות)',
            '`!h <סיבה>` / `!h <קטגוריה> <סיבה>` — שליחת פניית תמיכה לצוות השרת',
            '`!ip` — הצגת כתובת ה-IP של שרת ה-Minecraft',
            '`!version` — הצגת גרסת ה-Minecraft הנתמכת בשרת',
            '`!staff` — הצגת רשימת חברי צוות השרת',
            '`!vt` — בדיקת תאריך הצטרפות לשרת וזכאות לתפקיד וותיק',
            '`!help1` — הצגת מדריך פקודות זה'
        ].join('\n');

        const slashCommandsField = [
            '`/status [user]` — הצגת סטטוס מפורט על משתמש',
            '`/rank` — בדיקת ה-XP, הרמה וההתקדמות שלך',
            '`/xpshop view` — צפייה בחנות תפקידי ה-XP ורכישת תפקידים',
            '`/ip` — הצגת כתובת ה-IP של השרת',
            '`/version` — הצגת גרסת ה-Minecraft הנתמכת בשרת'
        ].join('\n');

        const embed = createEmbed({
            title: `📖 מדריך פקודות - ${message.guild.name}`,
            description: `להלן רשימת כל הפקודות הזמינות לחברי השרת ב-**${message.guild.name}**:`,
            color: COLORS.PRIMARY,
            fields: [
                { name: '⚡ פקודות קידומת (!)', value: prefixCommandsField, inline: false },
                { name: '🚀 פקודות סלאש (/)', value: slashCommandsField, inline: false },
                { name: '💡 מערכת XP', value: 'מרוויחים **+5 XP** על כל הודעה בצ\'אט! כל **150 XP** מקנים **רמה 1+**.', inline: false }
            ],
            footerText: `${message.guild.name} • רשום !help1 בכל עת`
        });

        await message.reply({ embeds: [embed] });
    }
};
