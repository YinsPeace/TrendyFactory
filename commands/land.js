const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const { db: pool } = require('../database');

module.exports = {
  name: 'land',
  description: 'Display owned LAND NFTs',
  async execute(message, args) {
    console.log('land command executed');
    // Check if the user has the "LAND OWNER" role
    if (!message.member.roles.cache.some(role => role.name === 'LAND OWNER')) {
      return message.reply('You must have the LAND OWNER role to use this command.');
    }

    // Get the user's wallet address from the database
    const userId = message.author.id;
    const result = await pool.query('SELECT wallet_address FROM user_wallets WHERE user_id = $1', [userId]);

    if (result.rowCount === 0) {
      // Prompt the user to enter their wallet address
      const enterWalletEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setDescription('Your wallet address is not registered. Please enter your wallet address where your Riddzze land is being stored.');

      message.channel.send({ embeds: [enterWalletEmbed] });

      // Create a message collector to collect the user's response
      const walletAddressCollector = message.channel.createMessageCollector({
        filter: m => m.author.id === message.author.id,
        max: 1,
        time: 60000 // Collect the user's response for up to 1 minute
      });

      walletAddressCollector.on('collect', async m => {
        const walletAddress = m.content;

        // Save the wallet address in the database
        await pool.query('INSERT INTO user_wallets (user_id, wallet_address) VALUES ($1, $2)', [userId, walletAddress]);

        // Fetch and display the LAND NFT information
        await displayLandInformation(message, walletAddress);
      });

      walletAddressCollector.on('end', async (collected, reason) => {
        if (reason === 'time') {
          message.reply('You did not enter your wallet address in time. Please try the command again.');
        }
      });

      return;
    }
    console.log('connecting API');
    const walletAddress = result.rows[0].wallet_address;
    await displayLandInformation(message, walletAddress);
  }
};

async function displayLandInformation(message, walletAddress) {
    let landCount = 0;
    let pageNumber = 0;
    const limit = 50;
  
    while (true) {
      // Fetch the LAND NFT information from OpenSea API with pagination
      const openseaResponse = await axios.get(`https://api.opensea.io/api/v1/assets?owner=${walletAddress}&asset_contract_address=0xceB055f144cc7D2Cb31161B0e72c9AC6C373aCbc&order_direction=desc&offset=${pageNumber * limit}&limit=${limit}`, {
        headers: {
          'X-API-KEY': process.env.OPENSEA_API_KEY
        }
      });
  
      const landAssets = openseaResponse.data.assets;
  
      // Debugging: Print the fetched assets
      console.log(`Fetched assets (Page ${pageNumber}):`, landAssets);
  
      if (landAssets.length === 0) {
        // Break the loop if there are no more assets to fetch
        break;
      }
  
      landCount += landAssets.length;
      pageNumber++;
    }
  
    // Create the response embed
    const landEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Owned LAND NFTs')
      .setDescription(`Total 4x4 lands owned: ${landCount}`);
  
    // Send the embed to the user
    message.channel.send({ embeds: [landEmbed] });
  }
  