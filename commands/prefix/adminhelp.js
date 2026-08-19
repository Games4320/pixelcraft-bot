const { PermissionFlagsBits } = require('discord.js');
const { createEmbed, createErrorEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    name: 'adminhelp',
    description: 'מדריך מנהלים מקיף לכל הפקודות והמערכות',
    async execute(message) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply({ embeds: [createErrorEmbed('❌ פקודה זו מיועדת למנהלי השרת בלבד.')] });
        }

        const ticketField = [
            '• `/ticket panel` או `!ticket panel` — שליחת פאנל פתיחת טיקטים עם תפריט קטגוריות.',
            '• `/ticket set message message:<הודעה>` — הגדרת הודעת פתיחה מותאמת אישית לטיקט. משתנים: `{user}`, `{server}`, `{category}` ותיוגי רולים כגון `@Staff`, `@high-staff`.',
            '• `/ticket reset-message` — איפוס הודעת הטיקט להודעת ברירת המחדל.',
            '• `/ticket close` — סגירת הטיקט, מחיקת הערוץ והפקת תמליל שיחה (Transcript) ב-DM.',
            '• כפתור **קבל טיקט (Claim)** — נעילת הטיקט לצוות ושיוכו לחבר הצוות שלחץ.',
            '• כפתור **הוספת משתמש** — הוספת משתמש לטיקט לפי מזהה (ID).'
        ].join('\n');

        const giveawayField = [
            '• `/giveaway create time:<זמן> winners:<זוכים> prize:<פרס>` — יצירת הגרלה (לדוגמה: `10m 1 1000XP`).',
            '• `/giveaway reroll message_id:<ID>` או `!reroll <ID>` — בחירת זוכה חדש להגרלה שהסתיימה.',
            '• `/giveaway end message_id:<ID>` — סיום הגרלה באופן מיידי.'
        ].join('\n');

        const supportField = [
            '• `!h <סיבה>` / `!h <קטגוריה> <סיבה>` — שליחת פניית תמיכה בצ\'אט עם כפתור שיוך צוות (📌 שייך אליי).',
            '• `/h-set-message message:<הודעה>` — הגדרת תבנית ההודעה עבור פניות `!h`.',
            '• `/h-set-claim-perm role:<תפקיד>` — הגדרת התפקיד המורשה לשייך פניות `!h`.'
        ].join('\n');

        const xpField = [
            '• `/rank [user]` — בדיקת ה-XP והרמה (+5 XP על כל הודעה בצ\'אט, כל 150 XP מעלים רמה).',
            '• `/xpshop setup` — הגדרת חנות תפקידים ועלויות XP עבור חברי השרת.',
            '• `/xpshop view` — צפייה בחנות ומימוש תפקידים ב-XP על ידי שחקנים.',
            '• `/xp add/remove/set/reset user:<משתמש> amount:<כמות>` — ניהול נקודות XP של שחקנים (למנהלים).'
        ].join('\n');

        const serverField = [
            '• `/veteran set role role:<תפקיד>` (או `!vt set <@role>`) — הגדרת התפקיד שיוענק כמעמד וותיק (לדוגמה: Gold, Diamond, OG, וותיק). מעדכן דינמית את `!vt`.',
            '• `/status [user]` — הצגת סטטוס מפורט (הודעות, זמן בשיחה, XP, תפקיד גבוה, ותק בשרת, הזמנות).',
            '• `/clear message_amount:<כמות> [user]` (או `!clear <כמות>`) — מחיקה מהירה של עד 100 הודעות בערוץ.',
            '• `/ip set ip server_ip:<כתובת IP>` (או `!ip set <כתובת>`) — הגדרת IP של שרת המיינקראפט.',
            '• `/version set version version:<גרסה>` (או `!version set <גרסה>`) — הגדרת גרסת המיינקראפט.',
            '• `/setwelcome message:<הודעה>` — הגדרת הודעת ברוכים הבאים בערוץ (משתנים: `{join}`, `{inviter}`, `{server}`).',
            '• `/drop prize:<פרס>` — יצירת דרופ עם לחיצה מהירה (הראשון שלוחץ זוכה).'
        ].join('\n');

        const embed = createEmbed({
            title: `🛡️ מדריך מנהלים מקיף - ${message.guild.name}`,
            description: `להלן כל המערכות, הפקודות והקשרים ביניהן בבוט **${message.guild.name} Bot**:`,
            color: COLORS.PRIMARY,
            fields: [
                { name: '🎫 מערכת טיקטים ותמיכה (Ticket System)', value: ticketField, inline: false },
                { name: '🎁 מערכת הגרלות (Giveaways)', value: giveawayField, inline: false },
                { name: '🛠️ מערכת פניות מהירה (!h Support)', value: supportField, inline: false },
                { name: '⭐ מערכת XP וחנות תפקידים', value: xpField, inline: false },
                { name: '⚙️ ניהול שרת והגדרות כלליות', value: serverField, inline: false }
            ],
            footerText: `${message.guild.name} Bot • מדריך מנהלים`
        });

        await message.reply({ embeds: [embed] });
    }
};
