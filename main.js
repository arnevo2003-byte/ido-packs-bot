const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const express = require('express');

// שרת לשמירה על הבוט דלוק 24/7 ב-Render
const app = express();
const port = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Ido & Packs Multi-Bot is Online! 🚀'));
app.listen(port, () => console.log(`✅ השרת רץ על פורט ${port}`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers
    ]
});

const TOKEN = process.env.TOKEN;

client.once('ready', () => {
    console.log(`✅ הבוט ${client.user.tag} מחובר עם כל המערכות: טיקטים, אימות והגרלות!`);
});

// --- מערכת ברוכים הבאים ---
client.on('guildMemberAdd', member => {
    const welcomeChannel = member.guild.channels.cache.find(ch => ch.name === 'welcome' || ch.name === 'ברוכים-הבאים');
    if (!welcomeChannel) return;

    const embed = new EmbedBuilder()
        .setTitle(`ברוך הבא לשרת, ${member.user.username}! 🎉`)
        .setDescription('אנחנו שמחים שהצטרפת אלינו! אל תשכח לעבור באימות.')
        .setThumbnail(member.user.displayAvatarURL())
        .setColor('#5865F2');

    welcomeChannel.send({ embeds: [embed] });
});

// --- פקודות הגדרה (Setup) ---
client.on('messageCreate', async message => {
    if (message.author.bot || !message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    // הגדרת הודעת אימות (Verify)
    if (message.content === '!setup-verify') {
        const embed = new EmbedBuilder()
            .setTitle('מערכת אימות 🛡️')
            .setDescription('לחצו על הכפתור למטה כדי לקבל גישה לשרת.')
            .setColor('#00ff00');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('verify_btn').setLabel('אימות').setStyle(ButtonStyle.Success)
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }

    // הגדרת הודעת טיקטים (Tickets)
    if (message.content === '!setup-ticket') {
        const embed = new EmbedBuilder()
            .setTitle('מערכת תמיכה 🎫')
            .setDescription('זקוקים לעזרה? לחצו על הכפתור למטה כדי לפתוח טיקט.')
            .setColor('#5865F2');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_ticket').setLabel('פתח טיקט').setStyle(ButtonStyle.Primary)
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }

    // פקודת הגרלה: !giveaway [פרס]
    if (message.content.startsWith('!giveaway')) {
        const prize = message.content.split(' ').slice(1).join(' ');
        if (!prize) return message.reply('כתוב פרס! דוגמה: `!giveaway משחק חינם`');

        const embed = new EmbedBuilder()
            .setTitle('🎉 הגרלה! 🎉')
            .setDescription(`הפרס: **${prize}**\nלחצו על 🎉 כדי להשתתף!`)
            .setColor('#f1c40f');

        const msg = await message.channel.send({ embeds: [embed] });
        await msg.react('🎉');

        setTimeout(async () => {
            const reaction = msg.reactions.cache.get('🎉');
            const users = await reaction.users.fetch();
            const winner = users.filter(u => !u.bot).random();
            message.channel.send(winner ? `🎊 מזל טוב ל-${winner}! זכית ב: **${prize}**!` : 'אין משתתפים בהגרלה.');
        }, 60000);
    }
});

// --- טיפול בכפתורים (אימות וטיקטים) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // לוגיקת אימות
    if (interaction.customId === 'verify_btn') {
        const role = interaction.guild.roles.cache.find(r => r.name === 'Member' || r.name === 'ממבר');
        if (!role) return interaction.reply({ content: 'לא נמצא רול בשם Member.', ephemeral: true });
        
        await interaction.member.roles.add(role);
        await interaction.reply({ content: 'עברת את האימות בהצלחה! ✅', ephemeral: true });
    }

    // לוגיקת טיקטים
    if (interaction.customId === 'open_ticket') {
        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            ],
        });

        await interaction.reply({ content: `הטיקט שלך נפתח: ${channel}`, ephemeral: true });
        channel.send(`שלום ${interaction.user}, צוות התמיכה יתפנה אליך בהקדם.`);
    }
});

client.login(TOKEN).catch(err => console.error('❌ שגיאת טוקן:', err));
