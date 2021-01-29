function findSpot(title, data) {
    for (let i in data) {
        for (let j of data[i]) {
            if (j.title == title) {
                return j;
            }
        }
    }
}

async function generateCard(title, datafile) {
	const PlaceCard = require(datafile);
    for (let i in PlaceCard) {
        for (let j of PlaceCard[i]) {
            if (j.title == title) {
                return j;
            }
        }
    }
}

module.exports.generateCard = generateCard;
module.exports.findSpot = findSpot;