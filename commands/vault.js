const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'vault',
    description: 'Shows the amount of Riddz left in the vault',
    async execute(message, args, data) {
        const { riddzScores, faucet, faucetStatus, sandPriceUSD } = data;
        const riddzEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'Riddz');
        const riddzToSand = 0.16;
        const riddzValueUSD = faucet.balance * riddzToSand * sandPriceUSD;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setDescription(`Munnastery claims there's **${faucet.balance}** ${riddzEmoji} Riddz left in the vault, use \`!charge\` to claim some.`);
        message.channel.send({ embeds: [embed] });
    },
};
