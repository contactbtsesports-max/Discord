const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
});

const TOKEN = process.env.DISCORD_TOKEN;

// Moderation keywords and phrases
const BAD_WORDS = [
    // Add offensive words here
    'badword1',
    'badword2',
    'insult1',
    'insult2',
];

client.once('ready', () => {
    console.log(`${client.user.tag} has connected to Discord!`);
    console.log('------');
    console.log('Auto-Moderation Bot is active');
    client.user.setStatus('online');
    client.user.setActivity('for violations', { type: 'WATCHING' });
});

client.on('messageCreate', async (message) => {
    // Don't check messages from the bot itself
    if (message.author.bot) return;

    // Don't check DMs
    if (!message.guild) return;

    // Check for bad words
    const messageContent = message.content.toLowerCase();
    let violationFound = false;

    for (const word of BAD_WORDS) {
        if (messageContent.includes(word.toLowerCase())) {
            violationFound = true;
            break;
        }
    }

    if (violationFound) {
        try {
            // Delete the message
            await message.delete();

            // Send a warning embed to the user
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('⚠️ Message Removed')
                .setDescription('Your message was removed because it contained prohibited content.')
                .setFooter({ text: 'Please follow server rules.' });

            await message.author.send({ embeds: [embed] }).catch(() => {
                console.log(`Could not DM ${message.author.tag}`);
            });

            // Log the violation
            console.log(`Violation detected from ${message.author.tag}: Message deleted`);
        } catch (error) {
            console.error('Error processing message:', error);
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply(`Pong! ${client.ws.ping}ms`);
    }
});

if (!TOKEN) {
    console.error('Error: DISCORD_TOKEN not found in .env file');
    process.exit(1);
}

client.login(TOKEN);
