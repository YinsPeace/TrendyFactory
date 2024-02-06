const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { db: pool } = require('../database');

module.exports = {
    name: 'delriddz',
    description: 'Remove Riddz score from a user',
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
                .setDescription("Please mention a user to remove Riddz score from.")
                .setColor("#FFFF00");
            return message.channel.send({ embeds: [mentionUserEmbed] });
        }

        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) {
            const invalidAmountEmbed = new EmbedBuilder()
                .setDescription("Please enter a valid amount of Riddz score to remove.")
                .setColor("#FFFF00");
            return message.channel.send({ embeds: [invalidAmountEmbed] });
        }

        const userId = targetUser.id;
        if (!riddzScores[userId]) {
            riddzScores[userId] = 0;
        }

        const newScore = Math.max(0, riddzScores[userId] - amount);
        riddzScores[userId] = newScore;
        // Update the user's score in the PostgreSQL database
        await pool.query('UPDATE riddz_scores SET score = $1 WHERE user_id = $2', [newScore, userId]);

        const riddzEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'Riddz');
        const riddzToSand = 0.16;
        const riddzValueUSD = newScore * riddzToSand * sandPriceUSD;
        
        const successEmbed = new EmbedBuilder()
            .setDescription(`Removed ${amount} ${riddzEmoji} Riddz from ${targetUser.tag}. Their new balance is **${newScore}** ${riddzEmoji} ($${riddzValueUSD.toFixed(2)}).`)
            .setColor("#00FF00");
        message.channel.send({ embeds: [successEmbed] });
    },
};
