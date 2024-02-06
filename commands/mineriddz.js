const { EmbedBuilder } = require('discord.js');
const { db: pool } = require('../database');

let miningInProgress = false;
let miningEndTimestamp;
let currentUser;

module.exports = {
    name: 'mineriddz',
    description: 'Mine SAND blocks to earn Riddz',
    async execute(message, args, riddzScores) {
        if (miningInProgress) {
            const remainingTime = (miningEndTimestamp - Date.now()) / 1000;
            const remainingHours = Math.floor(remainingTime / 3600);
            const remainingMinutes = Math.floor((remainingTime % 3600) / 60);
            const warningEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setDescription(`Sorry, but ${currentUser} is currently using **[0x3845...d3903a5d0]** contract, return in ${remainingHours} hours and ${remainingMinutes} minutes to mine.`);
            return message.channel.send({ embeds: [warningEmbed] });
        }

        currentUser = message.author.toString();
        miningInProgress = true;
        miningEndTimestamp = Date.now() + 12 * 60 * 60 * 1000;

        const sandEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'thesandboxsandlogo');
    
        const connectedEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setDescription(`Connected to SAND ${sandEmoji} grid **[0x3845...d3903a5d0]** v0.1x, you're now mining block. Occupied by ${currentUser} for 12 hours.`);
        message.channel.send({ embeds: [connectedEmbed] });

        setTimeout(async() => {
            const userId = message.author.id;

            const randomValue = Math.random();
            let riddzEarned;
            let miningResult;
            let imageUrl;

            if (randomValue <= 0.001) {
                riddzEarned = 100;
                miningResult = 'Oh, wow! Your Riddzee just mined **M6 MTRCR**! It\'s worth 100 Riddz! There\'s a 0.1% chance to mine this thing.';
                imageUrl = 'https://i.imgur.com/qQDSUWQ.png';
            } else if (randomValue <= 0.01) {
                riddzEarned = 10;
                miningResult = 'A rare find! Your cyber Riddzee found **SiliconP0x!** It\'s worth 10 Riddz! There\'s a 0.9% chance to mine this thing. ';
                imageUrl = 'https://i.imgur.com/35u4TGE.png';
            } else {
                riddzEarned = 1;
                miningResult = 'Riddze, You just mined **TekFossils!** It\'s worth 1 Riddz. There\'s a 99% chance to mine this thing. ';
                imageUrl = 'https://i.imgur.com/wmIqTF5.png';
            }

                        // Update the user's score in the database
                        await pool.query('UPDATE riddz_scores SET score = score + $1 WHERE user_id = $2', [riddzEarned, userId]);

                        // Update the user's Riddz balance in the riddzScores object
                        if (riddzScores.hasOwnProperty(userId)) {
                            riddzScores[userId] += riddzEarned;
                        } else {
                            riddzScores[userId] = riddzEarned;
                        }
            
                        const resultEmbed = new EmbedBuilder()
                            .setColor('#0099ff')
                            .setDescription(miningResult)
                            .setImage(imageUrl);
                        message.channel.send({ embeds: [resultEmbed] });
            
                        miningInProgress = false;
                        currentUser = null;
                    }, 12 * 60 * 60 * 1000); // Set the mining period to 12 hours
                },
            };
            
