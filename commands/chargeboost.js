const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'chargeboost',
    description: 'Add 30 Riddz to the faucet, only usable by the server Administrator',
    async execute(message, args, data) {
        const { riddzScores, faucet, faucetStatus, sandPriceUSD } = data;

        if (!message.member.permissions.has[PermissionsBitField.Flags.ADMINISTRATOR] && message.member.id !== message.guild.ownerId) {
            const noPermissionEmbed = new EmbedBuilder()
                .setDescription("You do not have permission to use this command.")
                .setColor("#FF0000");
            return message.channel.send({ embeds: [noPermissionEmbed] });
        }

        faucet.balance += 30;

        const riddzEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'Riddz');

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setDescription(`The faucet's balance just increased by 30 ${riddzEmoji} Riddz!`);

        message.channel.send({ embeds: [embed] });
    },
};

