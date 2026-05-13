import discord
from discord.ext import commands
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

@bot.command(name='ping')
async def ping(ctx):
    """Check bot latency"""
    await ctx.send(f'Pong! {round(bot.latency * 1000)}ms')

if __name__ == '__main__':
    if not TOKEN:
        print("Error: DISCORD_TOKEN not found in .env file")
        exit()
    bot.run(TOKEN)
