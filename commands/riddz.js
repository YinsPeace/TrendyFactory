const { EmbedBuilder } = require('discord.js');
const { db } = require('../database');

module.exports = {
  name: 'riddz',
  description: "Check a user's Riddz score",
  execute(message, args, data) {
    const { riddzScores, faucet, faucetStatus, sandPriceUSD } = data;

    const user = message.mentions.users.first() || message.author;
    const userId = user.id;
    const score = riddzScores[userId] || 0;
    
    const riddzEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'Riddz');
    const riddzToSand = 0.16;
    const riddzValueUSD = score * riddzToSand * sandPriceUSD;

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setDescription(`${user.username} has **${score}** ${riddzEmoji} Riddz ($${riddzValueUSD.toFixed(2)} USD)`);

    message.channel.send({ embeds: [embed] });
  },
};
