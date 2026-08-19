const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'help1',
    description: 'מציג את רשימת פקודות הבוט',
    async execute(message) {
        const prefixCommandsField = [
            '`!rank [@משתמש]` — בדיקת ה-XP, הרמה וההתקדמות בדירוג',
            '`!lb` / `!top` — הצגת לוח 10 המובילים בשרת לפי XP ורמות (Leaderboard)',
            '`!status [@משתמש]` — הצגת סטטוס מפורט (הודעות, שיחות, XP, תפקיד, ותק, הזמנות)',
            '`!h <סיבה>` / `!h <קטגוריה> <סיבה>` — שליחת פניית תמיכה לצוות השרת',
            '`!ip` — הצגת כתובת ה-IP של שרת ה-Minecraft',
            '`!version` — הצגת גרסת ה-Minecraft הנתמכת בשרת',
            '`!staff` — הצגת רשימת חברי צוות השרת',
            '`!vt` — בדיקת תאריך הצטרפות לשרת וזכאות לתפקיד וותיק',
            '`!help1` — הצגת מדריך פקודות זה'
        ].join('\n');

        const slashCommandsField = [
            '`/adminhelp` — מדריך פקודות ניהול (לצוות בלבד)',
            '`/ticket setup` — שליחת פאנל טיקטים והגדרות',
            '`/set` — הגדרת חדר AFK, רול אוטומטי, חדר לוגים ורול נעילה',
            '`/lockserver` / `/unlockserver` — נעילת חירום / שחרור השרת',
            '`/clear` / `/giveaway` / `/reactionrole` / `/reroll` — ניהול צ\'אט והגרלות',
            '`/leaderboard` / `/status` / `/rank` / `/xpshop` — מערכת XP ורמות'
        ].join('\n');

        const embed = createEmbed({
            title: `📖 מדריך פקודות - ${message.guild.name}`,
            description: `להלן רשימת כל הפקודות הזמינות לחברי השרת ב-**${message.guild.name}**:`,
            color: COLORS.PRIMARY,
            fields: [
                { name: '⚡ פקודות קידומת (!)', value: prefixCommandsField, inline: false },
                { name: '🚀 פקודות סלאש (/)', value: slashCommandsField, inline: false },
                { name: '💡 מערכת XP ורמות', value: 'מרוויחים **15-25 XP** על כל הודעה בצ\'אט! כל **150 XP** מקנים **רמה 1+**. ה-XP נשמר לתמיד ומצטבר ללא איפוס!', inline: false }
            ],
            footerText: `${message.guild.name} • רשום !help1 בכל עת`
        });

        await message.reply({ embeds: [embed] });
    }
};
