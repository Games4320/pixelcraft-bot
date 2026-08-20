const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createEmbed, COLORS } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adminhelp')
        .setDescription('מדריך מנהלים מקיף: כל הפקודות, המערכות וההסברים')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                content: '❌ פקודה זו מיועדת למנהלי השרת בלבד.',
                ephemeral: true
            });
        }

        const ticketField = [
            '• `/ticket panel` או `/ticket setup` — שליחת פאנל פתיחת טיקטים עם תפריט קטגוריות.',
            '• `/ticket set message message:<הודעה>` — הגדרת הודעת פתיחה מותאמת אישית לטיקט. משתנים נתמכים: `{user}`, `{server}`, `{category}` ותיוגי רולים כגון `@Staff`, `@high-staff`.',
            '• `/ticket reset-message` — איפוס הודעת הטיקט להודעת ברירת המחדל.',
            '• `/ticket close` — סגירת הטיקט, מחיקת הערוץ והפקת תמליל שיחה (Transcript) ב-DM.',
            '• כפתור **קבל טיקט (Claim)** — נעילת הטיקט לצוות ושיוכו לחבר הצוות שלחץ.',
            '• כפתור **הוספת משתמש** — הוספת משתמש לטיקט לפי מזהה (ID).'
        ].join('\n');

        const giveawayField = [
            '• `/giveaway create time:<זמן> winners:<זוכים> prize:<פרס>` — יצירת הגרלה חדשה (לדוגמה: `10m 1 1000XP`).',
            '• `/giveaway reroll message_id:<ID>` או `/reroll message_id:<ID>` — בחירת זוכה חדש להגרלה שהסתיימה.',
            '• `/giveaway end message_id:<ID>` — סיום הגרלה באופן מיידי.'
        ].join('\n');

        const supportField = [
            '• `!h <סיבה>` / `!h <קטגוריה> <סיבה>` — שליחת פניית תמיכה בצ\'אט עם כפתור שיוך צוות (📌 שייך אליי).',
            '• `/h-set-message message:<הודעה>` — הגדרת תבנית ההודעה עבור פניות `!h`.',
            '• `/h-set-claim-perm role:<תפקיד>` — הגדרת התפקיד המורשה לשייך פניות `!h`.'
        ].join('\n');

        const xpField = [
            '• `/rank [user]` או `!rank [@user]` — בדיקת ה-XP, הרמה וההתקדמות (+15-25 XP על הודעה, +3 XP לכל דקת שיחה קולית).',
            '• `/set afkroom channel:<ערוץ>` (או `!setafk`) — הגדרת חדר שיחה קולי כ-AFK (שבו לא מקבלים Voice XP).',
            '• `/set levelingroom channel:<ערוץ>` — הגדרת ערוץ ייעודי להודעות עליית רמה (Level Up) למניעת הצפה בצ\'אט.',
            '• `/xpshop setup` — הגדרת חנות תפקידים ועלויות XP עבור חברי השרת.',
            '• `/xpshop view` — צפייה בחנות ומימוש תפקידים ב-XP על ידי שחקנים.',
            '• `/xp add/remove/set/reset user:<משתמש> amount:<כמות>` — ניהול נקודות XP של שחקנים (למנהלים).'
        ].join('\n');

        const serverField = [
            '• `/set autorole role:<תפקיד>` (או `!setautorole`) — הגדרת רול אוטומטי למצטרפים חדשים.',
            '• `/set logsroom channel:<ערוץ>` (או `!setlogs`) — הגדרת חדר הלוגים המרכזי של השרת.',
            '• `/setlock role role:<תפקיד>` (או `!setlock role`) — הגדרת רול הורדת דרגות בעת נעילת חירום.',
            '• `/lockserver` (או `!lockserver`) — נעילת חירום מלאה של כל הערוצים והורדת דרגות צוות (למעט הבעלים).',
            '• `/unlockserver` (או `!unlockserver`) — שחרור נעילת החירום ושחזור מלא של כל הערוצים והדרגות.',
            '• `/veteran set role role:<תפקיד>` — הגדרת התפקיד שיוענק כמעמד וותיק (לדוגמה: Gold, Diamond, OG, וותיק). מעדכן דינמית את `!vt`.',
            '• `/status [user]` — הצגת סטטוס מפורט (הודעות, זמן בשיחה, XP, תפקיד גבוה, ותק בשרת, הזמנות).',
            '• `/clear message_amount:<כמות> [user]` — מחיקה מהירה של עד 100 הודעות בערוץ.',
            '• `/ip set ip server_ip:<כתובת IP>` — הגדרת IP של שרת המיינקראפט (מוצג ב-`!ip` ו-`/ip`).',
            '• `/version set version version:<גרסה>` — הגדרת גרסת המיינקראפט (מוצג ב-`!version` ו-`/version`).',
            '• `/setwelcome message:<הודעה>` — הגדרת הודעת ברוכים הבאים בערוץ (משתנים: `{join}`, `{inviter}`, `{server}`).',
            '• `/drop prize:<פרס>` — יצירת דרופ עם לחיצה מהירה (הראשון שלוחץ זוכה).'
        ].join('\n');

        const autoModField = [
            '• **אנטי-פרסום (Anti-Invite):** מחיקה אוטומטית של קישורי הזמנה לשרתי דיסקורד אחרים ואזהרת השולח.',
            '• **אנטי-ספאם (Anti-Spam):** מחיקה והגנה מפני שליחת הודעות מהירה (מעל 5 הודעות ב-4 שניות) או חזרה על אותה הודעה.',
            '• **סינון קללות (Anti-Curse):** מחיקה אוטומטית של הודעות המכילות קללות וגידופים חמורים.',
            '• *חברי צוות בעלי הרשאות ניהול הודעות/שרת עוקפים את מנגנון ה-AutoMod אוטומטית.*'
        ].join('\n');

        const reactionRolesField = [
            '• `/reactionroles panel` — שליחת פאנל בחירת תפקידים בלחיצת כפתור (תומך עד 5 תפקידים, כפתורים מעוצבים ואימוג\'ים).'
        ].join('\n');

        const embed = createEmbed({
            title: `🛡️ מדריך מנהלים מקיף - ${interaction.guild.name}`,
            description: `להלן כל המערכות, הפקודות והקשרים ביניהן בבוט **${interaction.guild.name} Bot**:`,
            color: COLORS.PRIMARY,
            fields: [
                { name: '🎫 מערכת טיקטים ותמיכה (Ticket System)', value: ticketField, inline: false },
                { name: '🎁 מערכת הגרלות (Giveaways)', value: giveawayField, inline: false },
                { name: '🛡️ מערכת הגנה אוטומטית (Auto-Mod)', value: autoModField, inline: false },
                { name: '🎭 מערכת בחירת תפקידים (Reaction Roles)', value: reactionRolesField, inline: false },
                { name: '⭐ מערכת XP, רמות ו-Leaderboard', value: xpField, inline: false },
                { name: '🛠️ מערכת פניות מהירה (!h Support)', value: supportField, inline: false },
                { name: '⚙️ ניהול שרת והגדרות כלליות', value: serverField, inline: false }
            ],
            footerText: `${interaction.guild.name} Bot • מדריך מנהלים`
        });

        await interaction.reply({ embeds: [embed] });
    }
};
