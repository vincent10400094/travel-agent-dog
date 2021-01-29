const getRoute = require('./getRoute').getRoute;
attractions = ['台北霞海城隍廟', '國父紀念館', '南門市場'];


function scheduleCard(attractions, startPoint) {
    var data = getRoute(attractions, startPoint);
    var template = new ACData.Template(templateCard);
    var cardPayload = template.expand({
        $root: data
    });
    var adaptiveCard = CardFactory.adaptiveCard(cardPayload);
    return adaptiveCard;
}