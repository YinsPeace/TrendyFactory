const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'List available commands and their descriptions.',
    execute(message) {
        const riddzEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'Riddz');
        const sandEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'thesandboxsandlogo');

        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Riddzee Bot Commands')
            .setDescription('Here are the available commands:')
            .addFields(
                { name: '\u200B', value: `**!riddz** - Check your current **Riddz** ${riddzEmoji} balance.\n` +
                '**!vault** - Shows the current vault balance, use !charge to claim.\n' +
                '**!charge** - Charge **2 Riddz** from the faucet every 2 hours.\n' +
                '**!top** - Display top 20 Riddz holders on the Riddzee world.\n' +
                `**!mineriddz** - Mine SAND ${sandEmoji} blocks to earn Riddz.\n` +
                '**!coinflip** - Gamble -> !coinflip @username <enter riddz amount>' }
            );

        message.channel.send({ embeds: [helpEmbed] });
    },
};
