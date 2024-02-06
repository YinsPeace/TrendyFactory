const { db: pool } = require('./database');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const axios = require('axios');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv/config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const riddzFile = 'riddz.json';
let riddzScores = {};

async function initRiddzScoresTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS riddz_scores (
      user_id BIGINT PRIMARY KEY,
      score NUMERIC NOT NULL
    )
  `);
}

async function loadRiddzScores() {
  const res = await pool.query('SELECT user_id, score FROM riddz_scores');
  res.rows.forEach(row => {
    riddzScores[row.user_id] = row.score;
  });
}
initRiddzScoresTable();
loadRiddzScores();

global.challengedUsers = {};
global.challengers = [];

const faucet = {
  balance: 30,
  lastChargeTime: Date.now(),
};

const userLastCharge = {};

const faucetStatus = {
  status: "on",
};

let sandPriceUSD = 0;

async function fetchSandPrice() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=the-sandbox&vs_currencies=usd');
    sandPriceUSD = response.data['the-sandbox'].usd;
  } catch (error) {
    console.error('Error fetching SAND price:', error);
  }
}

// Fetch SAND price initially
fetchSandPrice();

// Update the SAND price every 30 minutes
setInterval(fetchSandPrice, 30 * 60 * 1000);

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

function resetFaucetAndSendResetMessage(channel) {
  faucet.balance = 30;
  faucet.lastChargeTime = Date.now();
  channel.send('Riddzee, you can now visit Munnastery and !charge your energy');
}

client.on('ready', () => {
  console.log('Bot is online');

  // Get the channel where you want to send the reset message
  const resetMessageChannel = client.channels.cache.get('1014437592034463745');

  // Calculate the time remaining until the next reset
  const timeToNextReset = 24 * 60 * 60 * 1000 - (Date.now() - faucet.lastChargeTime);

  // Set a timer to reset the faucet and send the reset message
  setTimeout(() => resetFaucetAndSendResetMessage(resetMessageChannel), timeToNextReset);

  // Set an interval to update the leaderboard every 60 minutes
  setInterval(updateLeaderboard, 60 * 60 * 1000);
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('!') || message.author.bot) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (commandName === 'give') {
    if (!message.member.permissions.has('ADMINISTRATOR')) {
      return message.reply('You do not have permission to use this command.');
    }
  
    const user = message.mentions.users.first();
    const amount = parseInt(args[1], 10);
  
    if (!user || isNaN(amount)) {
      return message.reply('Usage: `!give @user amount`');
    }
  
    try {
      const res = await pool.query('UPDATE riddz_scores SET score = score + $1 WHERE user_id = $2 RETURNING score', [amount, user.id]);
      
      if (res.rowCount === 0) {
        await pool.query('INSERT INTO riddz_scores (user_id, score) VALUES ($1, $2)', [user.id, amount]);
        message.channel.send(`Successfully created account and gave ${amount} Trendies to ${user.username}.`);
      } else {
        message.channel.send(`Successfully gave ${amount} Trendies to ${user.username}.`);
      }
      await updateLeaderboard();
    } catch (error) {
      console.error('Error in give command:', error);
      message.reply('There was an error executing the command.');
    }
  } else if (commandName === 'remove') {
    if (!message.member.permissions.has('ADMINISTRATOR')) {
      return message.reply('You do not have permission to use this command.');
    }
  
    const user = message.mentions.users.first();
    const amount = parseInt(args[1], 10);
  
    if (!user || isNaN(amount)) {
      return message.reply('Usage: `!remove @user amount`');
    }
  
    try {
      // Check if the user has enough Trendies to remove
      const checkRes = await pool.query('SELECT score FROM riddz_scores WHERE user_id = $1', [user.id]);
      if (checkRes.rowCount > 0 && checkRes.rows[0].score < amount) {
        return message.reply(`${user.username} does not have enough Trendies to remove.`);
      }
      
      // Update the user's Trendies balance in the database
      const res = await pool.query('UPDATE riddz_scores SET score = GREATEST(0, score - $1) WHERE user_id = $2 RETURNING score', [amount, user.id]);
      
      // If the user was not found in the database, send a message
      if (res.rowCount === 0) {
        return message.reply(`User ${user.username} does not have a Trendies account.`);
      }
  
      // Send a confirmation message
      message.channel.send(`Successfully removed ${amount} Trendies from ${user.username}.`);
      await updateLeaderboard();
    } catch (error) {
      console.error('Error in remove command:', error);
      message.reply('There was an error executing the command.');
    }
  }   else if (commandName === 'reset') {
    // Check if the user has the right permission to use the command
    if (!message.member.permissions.has('ADMINISTRATOR')) {
      return message.reply('You do not have permission to use this command.');
    }
  
    try {
      await pool.query('UPDATE riddz_scores SET score = 0');
      await updateLeaderboard(); // Update the leaderboard message
      message.channel.send('The leaderboard has been reset.');
    } catch (error) {
      console.error('Error in reset command:', error);
      message.reply('There was an error executing the reset command.');
    }
  } else {
    const command = client.commands.get(commandName);
    if (!command) {
      message.reply("I'm not sure what you mean. Try !help for a list of commands.");
      return;
    }
    
    try {
      command.execute(message, args, { riddzScores, faucet, faucetStatus, sandPriceUSD, pool });
    } catch (error) {
      console.error(error);
      message.reply('There was an error trying to execute that command.');
    }
  }
});

// Make sure to define the `updateLeaderboard` function outside of the event handler, at the same level as your `client.on('ready', ...)`

async function updateLeaderboard() {
  const leaderboardChannel = client.channels.cache.find(channel => channel.name === 'leaderboards');
  if (!leaderboardChannel) {
      console.log('Leaderboard channel not found.');
      return;
  }

  try {
      const res = await pool.query('SELECT user_id, score FROM riddz_scores ORDER BY score DESC LIMIT 30');
      const leaderboardEmbed = new EmbedBuilder()
        .setTitle('🏆 Leaderboard 🏆')
        .setColor('#0099ff')
        .setDescription('Top players and their Trendies:');
      
      const leaderboardPromises = res.rows.map(async (row, index) => {
          const positionEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔹';
          try {
              const user = await client.users.fetch(row.user_id);
              return `${positionEmoji} ${index + 1}. \`${user.username.trim()}\` - \`${row.score.toString().trim()} Trendies\``;
          } catch (error) {
              return `${positionEmoji} ${index + 1}. \`Unknown User (${row.user_id})\` - \`${row.score.toString().trim()} Trendies\``;
          }
      });

      const leaderboardLines = await Promise.all(leaderboardPromises);
      leaderboardEmbed.setDescription('**Leaderboard:**\n' + leaderboardLines.join('\n'));
      
      const messages = await leaderboardChannel.messages.fetch({ limit: 10 });
      const lastLeaderboardMessage = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);

      if (lastLeaderboardMessage) {
          await lastLeaderboardMessage.edit({ embeds: [leaderboardEmbed] });
      } else {
          await leaderboardChannel.send({ embeds: [leaderboardEmbed] });
      }
  } catch (error) {
      console.error('Error updating leaderboard:', error);
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'accept_coinflip' && interaction.user.id in global.challengedUsers) {
    const challengerId = global.challengedUsers[interaction.user.id].challengerId;

    // Generate a random result for the coin flip (either 0 or 1)
    const flipResult = Math.floor(Math.random() * 2);

    // Determine the winner based on the result
    const winnerId = flipResult === 0 ? challengerId : interaction.user.id;

    // Update the scores of the users
    const betAmount = global.challengedUsers[interaction.user.id].betAmount;
    const loserId = winnerId === challengerId ? interaction.user.id : challengerId;

    // Update the scores in the database
    await pool.query('UPDATE riddz_scores SET score = score + $1 WHERE user_id = $2', [betAmount, winnerId]);
    riddzScores[winnerId] += betAmount;

    await pool.query('UPDATE riddz_scores SET score = score - $1 WHERE user_id = $2', [betAmount, loserId]);
    riddzScores[loserId] -= betAmount;

    // Send a message to the channel with the result and the updated scores
    const resultMessage = flipResult === 0 ? 'Heads' : 'Tails';
    const winner = interaction.client.users.cache.get(winnerId);
    const resultEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setDescription(`${resultMessage}! ${winner} wins ${betAmount} Riddz!`);

    // Show a "Calculating result..." message and remove the buttons
    await interaction.update({ content: 'Calculating result...', components: [] });

    // Delay the result for 3 seconds
    setTimeout(async () => {
      await interaction.editReply({ content: 'Cha ching!', embeds: [resultEmbed] });
    }, 3000);

    // Remove the challenged user from the global.challengedUsers object
    delete global.challengedUsers[interaction.user.id];
    global.challengers = global.challengers.filter(id => id !== challengerId);
  } else if (interaction.customId === 'deny_coinflip' && interaction.user.id in global.challengedUsers) {
    const challengerId = global.challengedUsers[interaction.user.id].challengerId;

    // Code to handle coin flip denial
    await interaction.update({ components: [] });

    // Send a refusal message
    const refusalEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`${interaction.user} has refused to participate in a coinflip for ${global.challengedUsers[interaction.user.id].betAmount} Riddz.`);
    interaction.channel.send({ embeds: [refusalEmbed] });

    // Remove the challenged user from the global.challengedUsers object
    delete global.challengedUsers[interaction.user.id];
    global.challengers = global.challengers.filter(id => id !== challengerId);
  } else if (interaction.customId === 'cancel_coinflip' && ((interaction.user.id in global.challengedUsers) || Object.values(global.challengedUsers).some(entry => entry.challengerId === interaction.user.id))) {
    const challengedUserId = interaction.user.id in global.challengedUsers ? interaction.user.id : Object.keys(global.challengedUsers).find(userId => global.challengedUsers[userId].challengerId === interaction.user.id);
    const challengerId = global.challengedUsers[challengedUserId].challengerId;    

    // Code to handle coin flip cancellation
    await interaction.update({ components: [] });

    // Send a cancellation message
    const cancellationEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setDescription(`🛑 ${interaction.user} denied ${global.challengedUsers[challengedUserId].betAmount} Riddz coin flip.`);
    interaction.channel.send({ embeds: [cancellationEmbed] });

    // Remove the challenged user from the global.challengedUsers object
    delete global.challengedUsers[challengedUserId];
    global.challengers = global.challengers.filter(id => id !== challengerId);
  } else {
    // If the button is clicked by someone other than the challenged user
    await interaction.reply({ content: 'You are not the challenged user.', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
