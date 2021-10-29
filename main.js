import { Client, Guild, Intents, Message, MessageEmbed } from "discord.js";
import fs from "fs";
import fetch from "node-fetch";

const tokenJSON = JSON.parse(fs.readFileSync('config.json'))

const token = tokenJSON.token

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// Gets current date and stores for reading later.
const getDateAndStore = () => {

    // Creates new date.
    const date = new Date();

    // Assigns date to object.
    const dateObj = {
        date: date
    };

    // Stringifys to JSON format.
    const dateJSON = JSON.stringify(dateObj);

    // Writes date to file.
    fs.writeFile('date.json', dateJSON, (err) => {
        if (err) {
            throw err;
        }
    })
}

// Gets date from JSON.
const retrieveDate = () => {

    // Reads JSON file for date.
    const dateJSON = fs.readFileSync('date.json', 'utf-8', (err) => {
        if (err) {
            throw err;
        }
    });

    // Parses date back to object.
    const parsedDate = JSON.parse(dateJSON);

    const date = `${parsedDate.date}`

    return date;
}

// Will run program when bot is online and ready.
client.once('ready', () => {
	console.log('Mystic Faces sales bot online.');

    // Sets channel to send message to.
    const channel = client.channels.cache.get('831946794190897172');

    // Function to get sales data and embed.
    const getSalesData = async () => {

        const date = retrieveDate();
    
        // Requests sales data from Opensea API using date format from JSON.
        const req = await fetch(`https://api.opensea.io/api/v1/events?collection_slug=the-mystic-faces&event_type=successful&only_opensea=true&occurred_after=${date}`, (err) => {
            if (err) {
                console.log(err)
            }
        })
    
        // Converts req to readable object format.
        const events = await req.json();
    
        // Checks if there have been sales events since last date. If not, logs 'no sales made since last check'.
        if (events.asset_events != 0) {
    
            // Gets data for each object in asset_events array.
            events.asset_events.forEach(element => {
    
                // Stores object data in relevant variables to access later.
                let sellerUsername = " ";
                const sellerAddress = element.seller.address;
                let buyerUsername = " ";
                const buyerAddress = element.winner_account.address;
                const price = `${element.total_price * Math.pow(10, -18)} ETH`;
                const imageURL = element.asset.image_preview_url;
                const nftName = element.asset.name;
    
                // Stops error if seller username is null and sets to 'Unnamed'.
                if (element.seller.user.username == null) {
                    sellerUsername = 'Unnamed';
                } else {
                    sellerUsername = element.seller.user.username
                }
    
                // Stops error if buyer username is null and sets to 'Unnamed'.
                if (element.winner_account.user == null) {
                    buyerUsername = 'Unnamed';
                } else {
                    buyerUsername = element.winner_account.user.username;
                }

                // Embed structure to use for sending sales data.
                const salesDataEmbed = new MessageEmbed()
                    .setTitle("New sale for Mystic Faces on Opensea!")
                    .setDescription(`${nftName} was sold for ${[price]}.`)
                    .addFields(
                        { name: 'Seller', value: `${sellerUsername}`},
                        { name: 'Seller Address', value:`${sellerAddress}`},
                        { name: 'Buyer', value: `${buyerUsername}`},
                        { name: 'Buyer Address', value: `${buyerAddress}`},
                    )
                    .setImage(`${imageURL}`);
    
                // Sends embed to channel.
                channel.send({ embeds: [salesDataEmbed]} );
            });
        } else {

            // Logs to console if no sales have been made since last check.
            console.log('No sales made since last check.')
        }

        // Stores date at end of program to not double-post previous sales.
        getDateAndStore();
    }

    // Runs getSalesData every X amount of milliseconds.
    setInterval(getSalesData, 10000)
});


// Logs in with token provided.
client.login(token);
