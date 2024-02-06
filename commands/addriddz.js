const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { db: pool } = require('../database');

module.exports = {
    name: 'addriddz',
    description: 'Add Riddz score to a user',
    async execute(message, args, data) {
        const { riddzScores, faucet, faucetStatus, sandPriceUSD } = data;

        if (!message.member.permissions.has[PermissionsBitField.Flags.ADMINISTRATOR] && message.member.id !== message.guild.ownerId) {
            const noPermissionEmbed = new EmbedBuilder()
                .setDescription("You do not have permission to use this command.")
                .setColor("#FF0000");
            return message.channel.send({ embeds: [noPermissionEmbed] });
        }

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            const mentionUserEmbed = new EmbedBuilder()
                .setDescription("Please mention a user to add Riddz score.")
                .setColor("#FFFF00");
            return message.channel.send({ embeds: [mentionUserEmbed] });
        }

        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) {
            const invalidAmountEmbed = new EmbedBuilder()
                .setDescription("Please enter a valid amount of Riddz score to add.")
                .setColor("#FFFF00");
            return message.channel.send({ embeds: [invalidAmountEmbed] });
        }

        const userId = targetUser.id;
        if (!riddzScores[userId]) {
            riddzScores[userId] = 0;
        }
        riddzScores[userId] += amount;

        // Save the updated scores to the riddz.db
        await pool.query('INSERT INTO riddz_scores (user_id, score) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET score = EXCLUDED.score', [userId, riddzScores[userId]]);

        const riddzEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'Riddz');
        const riddzToSand = 0.16;
        const riddzValueUSD = riddzScores[userId] * riddzToSand * sandPriceUSD;
        const successEmbed = new EmbedBuilder()
            .setDescription(`Added ${amount} ${riddzEmoji} Riddz to ${targetUser.tag}. New balance: **${riddzScores[userId]}** ${riddzEmoji} ($${riddzValueUSD.toFixed(2)} USD).`)
            .setColor("#00FF00");
        message.channel.send({ embeds: [successEmbed] });
    },
};
