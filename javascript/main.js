const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { REST } = require('discord.js');
const { Routes } = require('discord.js');
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

// Slash Commands
const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency'),
    
    new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check bot status'),
    
    new SlashCommandBuilder()
        .setName('addword')
        .setDescription('Add a word to the bad words list (Admin only)')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('The word to add')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('removeword')
        .setDescription('Remove a word from the bad words list (Admin only)')
        .addStringOption(option =>
            option.setName('word')
                .setDescription('The word to remove')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
    console.log(`${client.user.tag} has connected to Discord!`);
    console.log('------');
    console.log('Auto-Moderation Bot is active');
    client.user.setStatus('online');
    client.user.setActivity('for violations', { type: 'WATCHING' });

    // Register slash commands
    try {
        console.log('Registering slash commands...');
        await rest.put(Routes.applicationCommands(client.user.id), {
            body: commands.map(cmd => cmd.toJSON())
        });
        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Failed to register slash commands:', error);
    }
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

    const { commandName } = interaction;

    if (commandName === 'ping') {
        const latency = client.ws.ping;
        await interaction.reply(`Pong! ${latency}ms`);
    }

    else if (commandName === 'status') {
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🤖 Auto-Moderation Bot Status')
            .setDescription('Bot is operational and monitoring messages')
            .addFields(
                { name: 'Status', value: '✅ Active', inline: false },
                { name: 'Version', value: '1.0.0', inline: false },
                { name: 'Mode', value: 'Auto-Moderation (Slash Commands)', inline: false }
            );
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    else if (commandName === 'addword') {
        const word = interaction.options.getString('word').toLowerCase();
        
        if (!BAD_WORDS.includes(word)) {
            BAD_WORDS.push(word);
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('✅ Word Added')
                .setDescription(`'${word}' has been added to the moderation list`);
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            const embed = new EmbedBuilder()
                .setColor(0xffa500)
                .setTitle('⚠️ Word Exists')
                .setDescription(`'${word}' is already in the moderation list`);
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }

    else if (commandName === 'removeword') {
        const word = interaction.options.getString('word').toLowerCase();
        const index = BAD_WORDS.indexOf(word);
        
        if (index > -1) {
            BAD_WORDS.splice(index, 1);
            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('✅ Word Removed')
                .setDescription(`'${word}' has been removed from the moderation list`);
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            const embed = new EmbedBuilder()
                .setColor(0xffa500)
                .setTitle('⚠️ Word Not Found')
                .setDescription(`'${word}' is not in the moderation list`);
            
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
});

if (!TOKEN) {
    console.error('Error: DISCORD_TOKEN not found in .env file');
    process.exit(1);
}

client.login(TOKEN);
