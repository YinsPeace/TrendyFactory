const { EmbedBuilder } = require('discord.js');
const cooldowns = new Map();
const { db: pool } = require('../database');

module.exports = {
    name: 'charge',
    description: 'Charge 0.5 Riddz from the faucet',
    async execute(message, args, data) {
        const { riddzScores, faucet, faucetStatus, sandPriceUSD } = data;

        if (faucetStatus.status === 'off') {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Munnastery Closed')
                .setDescription('Sorry, the great Munnastery has closed its doors for now.');
            message.channel.send({ embeds: [embed] });
            return;
        }

        const userId = message.author.id;
        const cooldownMinutes = 360;

        const lastChargeTime = cooldowns.get(userId);
        const currentTime = Date.now();
        const cooldownMs = cooldownMinutes * 60 * 1000;

        if (lastChargeTime && currentTime - lastChargeTime < cooldownMs) {
            const remainingMinutes = Math.ceil((cooldownMs - (currentTime - lastChargeTime)) / (60 * 1000));
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('Charge Cooldown')
                .setDescription(`You can use !charge again in ${remainingMinutes} minute(s).`);
            message.channel.send({ embeds: [embed] });
            return;
        }

        if (faucet.balance < 0.5) {
            const remainingHours = 24 - Math.floor((currentTime - faucet.lastChargeTime) / (60 * 60 * 1000));
            const embed = new EmbedBuilder()
              .setColor('#FFA500')
              .setTitle('Munnastery Closed')
              .setDescription(`Sorry! Munnastery is closed, come back in ${remainingHours} hour(s)!`);
            message.channel.send({ embeds: [embed] });
            return;
          }

        faucet.balance -= 0.5;
        await pool.query('UPDATE riddz_scores SET score = score + 0.5 WHERE user_id = $1', [userId]);

            if (!riddzScores[userId]) {
                riddzScores[userId] = 0;
            }

            riddzScores[userId] += 0.5;
            cooldowns.set(userId, currentTime);

            const riddzEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'Riddz');
            const riddzToSand = 0.16;
            const riddzValueUSD = 0.5 * riddzToSand * sandPriceUSD;
            const chargingEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(':battery: Charging')
                .setDescription(`You're charging, here's 0.5 ${riddzEmoji} Riddz! ($${riddzValueUSD.toFixed(2)})`);
            message.channel.send({ embeds: [chargingEmbed] });
    },
};
