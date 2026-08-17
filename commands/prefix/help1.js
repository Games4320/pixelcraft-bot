const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'help1',
    description: 'מציג את רשימת פקודות הבוט',
    async execute(message) {
        const prefixCommandsField = [
            '`!h <סיבה>` / `!h <קטגוריה> <סיבה>` — שליחת פניית תמיכה (כולל כפתור שיוך צוות)',
            '`!vt` — בדיקת תאריך הצטרפות וזכאות לתפקיד וותיק',
            '`!staff` — הצגת רשימת חברי צוות השרת',
            '`!ip` — הצגת כתובת ה-IP של שרת ה-Minecraft (`play.birzia.co.il`)',
            '`!version` — הצגת גרסת ה-Minecraft הנתמכת (`1.21.8+`)',
            '`!help1` — הצגת תפריט העזרה והפקודות'
        ].join('\n');

        const slashCommandsField = [
            '`/rank` — בדיקת ה-XP, הרמה וההתקדמות שלך',
            '`/xpshop` — חנות תפקידים: רכישת תפקידים ב-XP או הגדרת חנות (מנהלים)',
            '`/ticket` — פתיחת פאנל טיקטים ותמיכה (`setup`/`panel`) או סגירת טיקט',
            '`/setwelcome` — הגדרת הודעת ברוכים הבאים וערוץ קבלה (מנהלים)',
            '`/h-set-message` — הגדרת תבנית הודעת תמיכה לפקודה `!h` (צוות/מנהלים)',
            '`/h-set-claim-perm` — הגדרת תפקיד מורשה לשיוך פניות `!h` (מנהלים)'
        ].join('\n');

        const embed = createEmbed({
            title: '📖 מדריך פקודות הבוט',
            description: 'להלן רשימת כל הפקודות הזמינות בבוט:',
            color: COLORS.PRIMARY,
            fields: [
                { name: '⚡ פקודות קידומת (!)', value: prefixCommandsField, inline: false },
                { name: '🚀 פקודות סלאש (/)', value: slashCommandsField, inline: false },
                { name: '💡 מערכת XP', value: 'מרוויחים **+5 XP** על כל הודעה בצ\'אט! כל **150 XP** מקנים **רמה 1+**.', inline: false }
            ],
            footerText: 'בוט בירזיה • רשום !help1 בכל עת'
        });

        await message.reply({ embeds: [embed] });
    }
};
