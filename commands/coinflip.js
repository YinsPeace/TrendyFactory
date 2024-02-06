const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const { db: pool } = require('../database');

module.exports = {
    name: 'coinflip',
    description: 'Challenge another user to a coin flip bet',
    async execute(message, args, riddzScores) {
        if (args.length < 2) {
            const invalidUserEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('Correct format: **!coinflip @user amount**');
            return message.channel.send({ embeds: [invalidUserEmbed] });
        }
    
        const challengedUser = message.mentions.users.first();
        
        if (!challengedUser) {
            const invalidUserEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('Please try again using **!coinflip @username <amount>**');
            return message.channel.send({ embeds: [invalidUserEmbed] });
        }
    
        if (challengedUser.id === message.author.id) {
            const selfChallengeEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('You cannot challenge yourself to a coin flip.');
            return message.channel.send({ embeds: [selfChallengeEmbed] });
        }
        
        const amount = parseInt(args[1]);
    
        if (challengedUser.bot) {
            const invalidUserEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('Please mention a valid user to challenge.');
            return message.channel.send({ embeds: [invalidUserEmbed] });
        }
    
        if (isNaN(amount) || amount < 1) {
            const invalidAmountEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('Please enter a valid bet amount.');
            return message.channel.send({ embeds: [invalidAmountEmbed] });
        }

        if (global.challengers.includes(message.author.id)) {
            const pendingChallengeEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('You can only have one pending coin flip challenge at a time.');
            return message.channel.send({ embeds: [pendingChallengeEmbed] });
        }

        // Check if the user is being challenged by someone else
        if (message.author.id in global.challengedUsers) {
            const beingChallengedEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`You're currently being challenged by <@${global.challengedUsers[message.author.id].challengerId}>.`);
            return message.channel.send({ embeds: [beingChallengedEmbed] });
        }

        const authorId = message.author.id;
        const challengedUserId = challengedUser.id;

        pool.query('SELECT score FROM riddz_scores WHERE user_id = $1', [authorId], (err, results) => {
            if (err) {
                console.error(err);
                return;
            }
        
            const authorScore = results.rows[0] ? results.rows[0].score : 0;
        
            if (authorScore < amount) {
                const insufficientFundsEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription("You don't have enough Riddz to make this bet.");
                return message.channel.send({ embeds: [insufficientFundsEmbed] });
            }
        
            pool.query('SELECT score FROM riddz_scores WHERE user_id = $1', [challengedUserId], (err, results) => {
                if (err) {
                    console.error(err);
                    return;
                }
        
                const challengedUserScore = results.rows[0] ? results.rows[0].score : 0;
        
                if (challengedUserScore < amount) {
                    const challengedUserInsufficientFundsEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription(`${challengedUser} doesn't have enough Riddz to accept this bet.`);
                    return message.channel.send({ embeds: [challengedUserInsufficientFundsEmbed] });
                }


                const challengeEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Coin Flip Challenge')
                    .setDescription(`${message.author} has challenged ${challengedUser} to a coin flip bet for ${amount} Riddz!`);

                const acceptButton = new ButtonBuilder()
                    .setCustomId('accept_coinflip')
                    .setLabel('Accept')
                    .setStyle('Success')
                    .setEmoji('✅');

                const denyButton = new ButtonBuilder()
                    .setCustomId('deny_coinflip')
                    .setLabel('Deny')
                    .setStyle('Success')
                    .setEmoji('❎');

                const cancelButton = new ButtonBuilder()
                    .setCustomId('cancel_coinflip')
                    .setLabel('Cancel')
                    .setStyle('Primary')
                    .setEmoji('🛑');
                
                const actionRow = new ActionRowBuilder().addComponents(acceptButton, denyButton, cancelButton);
                

                message.channel.send({ embeds: [challengeEmbed], components: [actionRow] });

                // Store the challenged user, challenger, and bet amount
                global.challengedUsers[challengedUserId] = {
                    challengerId: authorId,
                    betAmount: amount
                };

                // Add the challenger to the list of challengers waiting for a response
                global.challengers.push(authorId);
            });
        });
    },
};
