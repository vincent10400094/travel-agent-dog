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