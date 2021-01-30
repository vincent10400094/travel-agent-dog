const fetch = require('node-fetch');
const utility = require('./utility');

const getInfo = async (name) => {
    var res = await fetch(`https://atlas.microsoft.com/search/fuzzy/json?&api-version=1.0&subscription-key=6rs1RDSRucSV5j_99HpITvMr2UU1p2sFOdDV6Y9RURI&language=zh-TW&query=${encodeURI(name)}&countrySet=TW&lat=25.03914&lon=121.54784&limit=1&radius=20000`);
    var data = await res.json();
    let info = utility.findSpot(name);
    return {
        name: name,
        data: info,
        address: data.results[0].address.freeformAddress,
        position: data.results[0].position
    }
};

const getClosestPoint = async (attractions_info, start_info) => {
    let candidate = undefined;
    let min_time = 1000000;
    let min_dist = undefined;
    for (let i of attractions_info) {
        let res = await fetch(`https://atlas.microsoft.com/route/directions/json?subscription-key=6rs1RDSRucSV5j_99HpITvMr2UU1p2sFOdDV6Y9RURI&api-version=1.0&query=${start_info.position.lat},${start_info.position.lon}:${i.position.lat},${i.position.lon}&travelMode=bus`);
        let data = await res.json();
        let t = data.routes[0].summary.travelTimeInSeconds;
        let d = data.routes[0].summary.lengthInMeters;
        // console.log(`From ${start_info.name} to ${i.name}:`, t);
        if (t < min_time) {
            min_time = t;
            candidate = i;
            min_dist = d / 1000;
        }
    }
    return [candidate, min_time, min_dist];
};

const toTimeString = (sec_num) => {
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    // if (hours < 10) { hours = "0" + hours; }
    // if (minutes < 10) { minutes = "0" + minutes; }
    return minutes + '分鐘';
}

const getRoute = async (attractions, start) => {
    var schedule = [];
    var attractions_info = [];
    var start_info = await getInfo(start);
    for (a of attractions) {
        let info = await getInfo(a);
        attractions_info.push(info);
    }
    while (attractions_info.length > 0) {
        let result = await getClosestPoint(attractions_info, start_info);
        let closest = result[0];
        let idx = attractions_info.indexOf(closest);
        schedule.push({
            from: {
                name: start_info.name,
                img: start_info.data.img,
                address: start_info.address
            },
            to: {
                name: closest.name,
                img: closest.data.img,
                address: closest.address
            },
            time: toTimeString(result[1]),
            dist: result[2].toString() + '公里'
        });
        attractions_info.splice(idx, 1);
        start_info = closest;
    }
    // console.log('Schedule:', schedule);
    return schedule;
};

module.exports.getRoute = getRoute;