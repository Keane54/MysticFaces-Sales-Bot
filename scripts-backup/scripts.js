import fetch from "node-fetch";
import fs from "fs";

const getDateAndStore = () => {
    const date = new Date();

    const dateObj = {
        date: date
    };

    const dateJSON = JSON.stringify(dateObj);

    fs.writeFile('date.json', dateJSON, (err) => {
        if (err) {
            throw err;
        }
    })
}

const retrieveDate = () => {

    const dateJSON = fs.readFileSync('date.json', 'utf-8', (err) => {
        if (err) {
            throw err;
        }
    });

    const parsedDate = JSON.parse(dateJSON);

    const date = `${parsedDate.date}`

    return date;
}

export const getSalesData = async () => {

    const date = retrieveDate();

    const req = await fetch(`https://api.opensea.io/api/v1/events?collection_slug=the-mystic-faces&event_type=successful&only_opensea=true&occurred_after=${date}`, (err) => {
        if (err) {
            console.log(err)
        }
    })

    const events = await req.json();

    if (events.asset_events != 0) {

        events.asset_events.forEach(element => {


            let sellerUsername = " ";
            const sellerAddress = element.seller.address;
            let buyerUsername = " ";
            const buyerAddress = element.winner_account.address;
            const price = `${element.total_price * Math.pow(10, -18)} ETH`;
            const imageURL = element.asset.image_preview_url;
            const nftName = element.asset.name;

            if (element.seller.user.username == null) {
                sellerUsername = 'Unnamed';
            } else {
                sellerUsername = element.seller.user.username
            }

            if (element.winner_account.user == null) {
                buyerUsername = 'Unnamed';
            } else {
                buyerUsername = element.winner_account.user.username;
            }

            return console.log({
                sellerUsername: sellerUsername,
                sellerAddress: sellerAddress,
                buyerUsername: buyerUsername,
                buyerAddress: buyerAddress,
                price: price,
                imageURL: imageURL,
                nftName: nftName
            })
        });
    } else {
        console.log('No sales made since last check.')
    }
    getDateAndStore();
}

setInterval(getSalesData, 5000);