const ACData = require("adaptivecards-templating");
const PlaceCard = require('../data/tourist_spots');
const templateCard = require('../templates/recommendCardTemplate');
const { CardFactory } = require('botbuilder');

function findSpot(title) {
    for (let i in PlaceCard) {
        for (let j of PlaceCard[i]) {
            if (j.title == title) {
                return j;
            }
        }
    }
}

function generateCard(title) {
    var data = findSpot(title);
    var template = new ACData.Template(templateCard);
    var cardPayload = template.expand({
        $root: data
    });
    var adaptiveCard = CardFactory.adaptiveCard(cardPayload);
    return adaptiveCard;

}

module.exports.generateCard = generateCard;
module.exports.findSpot = findSpot;
