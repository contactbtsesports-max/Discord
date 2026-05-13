import discord
from discord.ext import commands
from discord import app_commands
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
TOKEN = os.getenv('DISCORD_TOKEN')

# Initialize bot with intents
intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True

bot = commands.Bot(command_prefix='!', intents=intents)

# Moderation keywords and phrases
BAD_WORDS = [
    # Add offensive words here
    'badword1',
    'badword2',
    'insult1',
    'insult2',
]

@bot.event
async def on_ready():
    print(f'{bot.user} has connected to Discord!')
    print('------')
    print('Auto-Moderation Bot is active')
    await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.watching, name='for violations'))
    
    # Sync app commands
    try:
        synced = await bot.tree.sync()
        print(f'Synced {len(synced)} command(s)')
    except Exception as e:
        print(f'Failed to sync commands: {e}')

@bot.event
async def on_message(message):
    """Check every message for violations"""
    
    # Don't check messages from the bot itself
    if message.author == bot.user:
        return
    
    # Don't check DMs
    if isinstance(message.channel, discord.DMChannel):
        return
    
    # Check for bad words
    message_content = message.content.lower()
    
    violation_found = False
    for word in BAD_WORDS:
        if word.lower() in message_content:
            violation_found = True
            break
    
    if violation_found:
        try:
            # Delete the message
            await message.delete()
            
            # Send a warning to the user
            embed = discord.Embed(
                title="⚠️ Message Removed",
                description="Your message was removed because it contained prohibited content.",
                color=discord.Color.red()
            )
            embed.set_footer(text="Please follow server rules.")
            
            await message.author.send(embed=embed)
            
            # Log the violation
            print(f"Violation detected from {message.author}: Message deleted")
            
        except discord.Forbidden:
            print(f"Could not delete message from {message.author}")
        except Exception as e:
            print(f"Error processing message: {e}")
    
    await bot.process_commands(message)

# Slash Commands
@bot.tree.command(name='ping', description='Check bot latency')
async def ping(interaction: discord.Interaction):
    """Check bot latency"""
    latency = bot.latency * 1000
    await interaction.response.send_message(f'Pong! {round(latency)}ms')

@bot.tree.command(name='status', description='Check bot status')
async def status(interaction: discord.Interaction):
    """Check bot status"""
    embed = discord.Embed(
        title="🤖 Auto-Moderation Bot Status",
        description="Bot is operational and monitoring messages",
        color=discord.Color.green()
    )
    embed.add_field(name="Status", value="✅ Active", inline=False)
    embed.add_field(name="Version", value="1.0.0", inline=False)
    embed.add_field(name="Mode", value="Auto-Moderation (Slash Commands)", inline=False)
    
    await interaction.response.send_message(embed=embed, ephemeral=True)

@bot.tree.command(name='addword', description='Add a word to the bad words list (Admin only)')
@app_commands.checks.has_permissions(administrator=True)
async def addword(interaction: discord.Interaction, word: str):
    """Add a word to moderation list"""
    word_lower = word.lower()
    
    if word_lower not in BAD_WORDS:
        BAD_WORDS.append(word_lower)
        embed = discord.Embed(
            title="✅ Word Added",
            description=f"'{word_lower}' has been added to the moderation list",
            color=discord.Color.green()
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)
    else:
        embed = discord.Embed(
            title="⚠️ Word Exists",
            description=f"'{word_lower}' is already in the moderation list",
            color=discord.Color.orange()
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

@bot.tree.command(name='removeword', description='Remove a word from the bad words list (Admin only)')
@app_commands.checks.has_permissions(administrator=True)
async def removeword(interaction: discord.Interaction, word: str):
    """Remove a word from moderation list"""
    word_lower = word.lower()
    
    if word_lower in BAD_WORDS:
        BAD_WORDS.remove(word_lower)
        embed = discord.Embed(
            title="✅ Word Removed",
            description=f"'{word_lower}' has been removed from the moderation list",
            color=discord.Color.green()
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)
    else:
        embed = discord.Embed(
            title="⚠️ Word Not Found",
            description=f"'{word_lower}' is not in the moderation list",
            color=discord.Color.orange()
        )
        await interaction.response.send_message(embed=embed, ephemeral=True)

if __name__ == '__main__':
    if not TOKEN:
        print("Error: DISCORD_TOKEN not found in .env file")
        exit()
    bot.run(TOKEN)
