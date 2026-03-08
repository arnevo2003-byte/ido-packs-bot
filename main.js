const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const app = express();

// שרת למניעת שינה ב-Render
app.get('/', (req, res) => res.send('ido & packs is Online 24/7! 🚀'));
const port = process.env.PORT || 3002;
app.listen(port, () => console.log(`📡 השרת רץ על פורט ${port}`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// --- הגדרות ה-IDs שלך (ido & packs) ---
const TOKEN = process.env.TOKEN; 
const VERIFY_ROLE_ID = '1480233905498882168'; // רול pack
const STAFF_ROLE_ID = '1480241408190316595';  // רול צוות
const WELCOME_CHANNEL_ID = '1480233707968135321'; // ערוץ ברוכים הבאים
// --------------------------------------------------

client.once('ready', () => {
    console.log(`✅ הבוט ${client.user.tag} מחובר ללא מוזיקה ומוכן לעבודה!`);
});

// הודעת ברוכים הבאים טקסטואלית
client.on('guildMemberAdd', async (member) => {
    try {
        const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
        if (!channel) return;
        const welcomeEmbed = new EmbedBuilder()
            .setTitle('ברוך הבא ל-ido & packs! 🎉')
            .setDescription(`שלום ${member}, שמחים שהצטרפת! אל תשכח לבצע אימות בערוץ המתאים.`)
            .setColor('#00ff00')
            .setThumbnail(member.user.displayAvatarURL());
        
        await channel.send({ embeds: [welcomeEmbed] });
    } catch (e) { console.error("שגיאה בברוכים הבאים:", e); }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!setup-verify') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('v_btn').setLabel('אימות pack ✅').setStyle(ButtonStyle.Success)
        );
        const embed = new EmbedBuilder()
            .setTitle('מערכת אימות - ido & packs')
            .setDescription('לחצו על הכפתור למטה כדי לקבל רול pack.')
            .setColor('#2ecc71');
        message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content === '!setup-tickets') {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_t').setLabel('פתח פנייה 📩').setStyle(ButtonStyle.Primary)
        );
        const embed = new EmbedBuilder()
            .setTitle('מרכז תמיכה ורכישות')
            .setDescription('צריכים עזרה או רוצים לקנות? פתחו טיקט כאן.')
            .setColor('#3498db');
        message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    try {
        if (interaction.customId === 'v_btn') {
            await interaction.deferReply({ ephemeral: true });
            await interaction.member.roles.add(VERIFY_ROLE_ID);
            return interaction.editReply('קיבלת רול pack בהצלחה! 🎉');
        }

        if (interaction.customId === 'open_t') {
            await interaction.deferReply({ ephemeral: true });
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                    { id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                ],
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('claim_t').setLabel('🙋‍♂️ קח טיפול').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('close_t').setLabel('🔒 סגור טיקט').setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({ content: `שלום ${interaction.user}, המתן לצוות.`, components: [row] });
            return interaction.editReply(`הטיקט נפתח: ${ticketChannel}`);
        }

        if (interaction.customId === 'claim_t') {
            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: 'רק סטאף יכול!', ephemeral: true });
            await interaction.update({ components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('c').setLabel('בטיפול...').setStyle(ButtonStyle.Secondary).setDisabled(true))] });
            return interaction.channel.send({ embeds: [new EmbedBuilder().setDescription(`⚡ בטיפול של: ${interaction.user}`).setColor('#2ecc71')] });
        }

        if (interaction.customId === 'close_t') {
            await interaction.reply('נסגר בעוד 3 שניות...');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    } catch (err) { console.error(err); }
});


client.login(TOKEN);
