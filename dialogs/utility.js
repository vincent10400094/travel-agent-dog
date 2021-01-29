const ACData = require("adaptivecards-templating");
const PlaceCard = require('../data/tourist_spots');
const recommendCardTemplate = require('../templates/recommendCardTemplate');
const scheduleCardTemplate = require('../templates/scheduleCardTemplate');
const getRoute = require('./getRoute').getRoute;
const templateCard = require('../templates/recommendCardTemplate');
const { CardFactory } = require('botbuilder');

module.exports.findSpot = (title) => {
    for (let i in PlaceCard) {
        for (let j of PlaceCard[i]) {
            if (j.title == title) {
                return j;
            }
        }
    }
}

module.exports.generateCard = (title) => {
    var data = module.exports.findSpot(title);
    var template = new ACData.Template(recommendCardTemplate);
    var cardPayload = template.expand({
        $root: data
    });
    var adaptiveCard = CardFactory.adaptiveCard(cardPayload);
    return adaptiveCard;
}

module.exports.scheduleCard = async (attractions, startPoint) => {
    var data = await getRoute(attractions, startPoint);
    var cardArray = [];
    for (let i of data) {
        var j = JSON.stringify(i);
        var template = new ACData.Template(scheduleCardTemplate);
        var cardPayload = template.expand({
            $root: j
        });
        var adaptiveCard = CardFactory.adaptiveCard(cardPayload);
        cardArray.push(adaptiveCard);
    }
    return cardArray;
}