const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'top',
    description: 'Display the top 20 users with the highest Riddz scores',
    async execute(message, args, data) {
        const { riddzScores, faucet, sandPriceUSD, faucetStatus } = data;

        const riddzEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'Riddz');

        // Convert the riddzScores object into an array of user-score pairs, filtering out the faucet entry
        const userScoresArray = Object.entries(riddzScores).filter(([userId]) => userId !== 'faucet');

        // Sort the array by score in descending order
        userScoresArray.sort((a, b) => b[1] - a[1]);

        // Take the top 20 users
        const topUsers = userScoresArray.slice(0, 20);

        // Format the output message
        let outputMessage = 'Top 20 Riddz users:\n\n';
        for (const [index, user] of topUsers.entries()) {
            try {
                const member = await message.guild.members.fetch(user[0]);
                const riddzToSand = 0.16;
                const riddzValueUSD = user[1] * riddzToSand * sandPriceUSD;
                outputMessage += `**#${index + 1}** **${member.user.username}**: ${user[1]} ${riddzEmoji} Riddz ($${riddzValueUSD.toFixed(2)} USD)\n`;
            } catch (error) {
                console.error(`Failed to fetch member for user ID: ${user[0]}`, error);
            }
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setDescription(outputMessage);

        message.channel.send({ embeds: [embed] });
    },
};
