const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'help1',
    description: 'מציג את רשימת פקודות הבוט',
    async execute(message) {
        const prefixCommandsField = [
            '`!h <סיבה>` / `!h <קטגוריה> <סיבה>` — שליחת פניית תמיכה (כולל כפתור שיוך צוות)',
            '`!vt` — בדיקת תאריך הצטרפות וזכאות לתפקיד וותיק',
            '`!staff` — הצגת רשימת חברי צוות השרת',
            '`!ip` — הצגת כתובת ה-IP של שרת ה-Minecraft',
            '`!version` — הצגת גרסת ה-Minecraft הנתמכת',
            '`!help1` — הצגת תפריט העזרה והפקודות'
        ].join('\n');

        const slashCommandsField = [
            '`/rank` — בדיקת ה-XP, הרמה וההתקדמות שלך',
            '`/xpshop` — חנות תפקידים: רכישת תפקידים ב-XP או הגדרת חנות (מנהלים)',
            '`/giveaway` — מערכת הגרלות: יצירת הגרלה (`create`), הגרלה מחדש (`reroll`), או סיום (`end`)',
            '`/ticket` — פאנל טיקטים (`setup`/`panel`), סגירה (`close`), והגדרת הודעה (`set message`)',
            '`/drop` — יצירת דרופ עם כפתור לחיצה מהירה (מנהלים)',
            '`/setwelcome` — הגדרת הודעת ברוכים הבאים וערוץ קבלה (מנהלים)',
            '`/h-set-message` — הגדרת תבנית הודעת תמיכה לפקודה `!h` (מנהלים)',
            '`/h-set-claim-perm` — הגדרת תפקיד מורשה לשיוך פניות `!h` (מנהלים)'
        ].join('\n');

        const embed = createEmbed({
            title: `📖 מדריך פקודות הבוט - ${message.guild.name}`,
            description: `להלן רשימת כל הפקודות הזמינות בבוט עבור **${message.guild.name}**:`,
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
