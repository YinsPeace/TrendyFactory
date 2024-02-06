const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'chargeon',
    description: 'Turns on the !charge command for users',
    async execute(message, args, data) {
        const { riddzScores, faucet, faucetStatus, sandPriceUSD } = data;

        if (!message.member.permissions.has[PermissionsBitField.Flags.ADMINISTRATOR] && message.member.id !== message.guild.ownerId) {
            const noPermissionEmbed = new EmbedBuilder()
                .setDescription("You do not have permission to use this command.")
                .setColor("#FF0000");
            return message.channel.send({ embeds: [noPermissionEmbed] });
        }

        faucetStatus.status = "on"; // Change this line

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setDescription('The Faucet has been turned on!');

        message.channel.send({ embeds: [embed] });
    },
};
