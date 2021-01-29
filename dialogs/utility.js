const ACData = require("adaptivecards-templating");
const PlaceCard = require('../data/tourist_spots');
const recommendCardTemplate = require('../templates/recommendCardTemplate');
const scheduleCardTemplate = require('../templates/scheduleCardTemplate');
const getRoute = require('./getRoute').getRoute;
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
    var template = new ACData.Template(recommendCardTemplate);
    var cardPayload = template.expand({
        $root: data
    });
    var adaptiveCard = CardFactory.adaptiveCard(cardPayload);
    return adaptiveCard;

}

function scheduleCard(attractions, startPoint) {
    var data = getRoute(attractions, startPoint);
    console.log(data);
    var cardArray = [];
    for (let i of data) {
        console.log(i);
        var template = new ACData.Template(scheduleCardTemplate);
        var cardPayload = template.expand({
            $root: i
        });
        var adaptiveCard = CardFactory.adaptiveCard(cardPayload);
        cardArray.push(adaptiveCard);
    }
    return cardArray;
}

module.exports.generateCard = generateCard;
module.exports.findSpot = findSpot;
module.exports.scheduleCard = scheduleCard;