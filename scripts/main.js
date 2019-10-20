////////////////////////////////
//// Bus Map Functionality ////
//////////////////////////////

//creates map using mapbox in leaflet

const mymap = L.map('mapDiv',{center: [33.75, -84.38], zoom: 12, minZoom:12, maxZoom:16, scrollWheelZoom: false});
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiY21rZW1wNTIiLCJhIjoiY2sxN3czcWZ0MWw4aDNicWQ5ZGk3ZGRiciJ9.TmrrAvuGokXxLMhoa96krg', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
	maxZoom: 18,
	id: 'mapbox.streets',
}).addTo(mymap);



//defining images for map icons
const nIcon = L.icon({iconUrl:"images/busnorth.png",iconSize:[50,50],iconAnchor:[25,25],popupAnchor:[0,-10]}),
    sIcon = L.icon({iconUrl:"images/bussouth.png",iconSize:[50,50],iconAnchor:[25,25],popupAnchor:[0,-10]}),
    eIcon = L.icon({iconUrl:"images/buseast.png",iconSize:[50,50],iconAnchor:[25,25],popupAnchor:[0,-10]}),
    wIcon = L.icon({iconUrl:"images/buswest.png",iconSize:[50,50],iconAnchor:[25,25],popupAnchor:[0,-10]});

//updates bus map every 5 seconds
updateAPI();
setInterval(function(){
    updateAPI();
},5000);

function updateAPI(){
    //Adds user location to map if available
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(userAdd);
    }
    //gets bus data
    fetch("https://my-little-cors-proxy.herokuapp.com/http://developer.itsmarta.com/BRDRestService/RestBusRealTimeService/GetAllBus")
        .then(data=>data.json())
        .then(function(jsondata){
            //Checks how many buses are late, early, on time
            let busLate = 0;
            let busEarly = 0;
            let busOnTime = 0;
            for(bus in jsondata){
                if(jsondata[bus].ADHERENCE >0){
                    busLate++;
                }
                if(jsondata[bus].ADHERENCE <0){
                    busEarly++;
                }
                if(jsondata[bus].ADHERENCE ==0){
                    busOnTime++;
                }
                //removes and adds buses to map
                busAdd(jsondata[bus]);
            }
            //turns bus data into percentages
            busLatePercent = (busLate/(busLate+busEarly+busOnTime))*100
            busEarlyPercent = (busEarly/(busLate+busEarly+busOnTime))*100
            busOnTimePercent = (busOnTime/(busLate+busEarly+busOnTime))*100
            //gives bus chart Marta colors
            CanvasJS.addColorSet("martaColors",["#0092D0","#FDBE43","#FF7500"]);
            //Creates chart using canvasjs, populates chart with bus data
            chart = new CanvasJS.Chart("chartContainer", {
                animationEnabled: false,
                colorSet: 'martaColors',
                backgroundColor: "#396073",
                title: {
                    fontColor:"white",
                    text: "Marta by the Minute"
                },
                data: [{
                    indexLabelFontColor: "white",
                    type: "pie",
                    startAngle: 240,
                    yValueFormatString: "##0.00\"%\"",
                    indexLabel: "{label} {y}",
                    dataPoints: [
                        {y: busLatePercent, label: "Late Buses"},
                        {y: busEarlyPercent, label: "Early Buses"},
                        {y: busOnTimePercent, label: "On Time Buses"},
                    ]
                }]
            });
            chart.render();
        })
        .catch(err=>console.log(err));
}
//updates user location on map
function userAdd(user){
    console.log(user);
    userMarker = L.marker([user.coords.latitude, user.coords.longitude]).addTo(mymap);
    userMarker.bindPopup("Your location");
}

//updates bus location on map
function busAdd(bus){
    //Removes bus from map
    mymap.eachLayer(function(tlayer){
        if(tlayer._icon != undefined){
            if(tlayer._popup._content.includes(`Bus ID:${bus.VEHICLE}`)){
                mymap.removeLayer(tlayer);
            }
        }});
    //adds bus to map, image based on bus direction
    switch(bus.DIRECTION){
        case "Northbound":
                marker = L.marker([bus.LATITUDE, bus.LONGITUDE],{icon:nIcon}).addTo(mymap);
                break;
        case "Southbound":
                marker = L.marker([bus.LATITUDE, bus.LONGITUDE],{icon:sIcon}).addTo(mymap);
                break;
        case "Eastbound":
                marker = L.marker([bus.LATITUDE, bus.LONGITUDE],{icon:eIcon}).addTo(mymap);
                break;
        case "Westbound":
                marker = L.marker([bus.LATITUDE, bus.LONGITUDE],{icon:wIcon}).addTo(mymap);
                break;
        }
        //gives bus icons helpful data when you select them
        if(bus.ADHERENCE >0){
            marker.bindPopup(`<b>Bus Rt: ${bus.ROUTE} Bus ID:${bus.VEHICLE}</b><br> Currently ${bus.ADHERENCE} minute\(s\) ahead of schedule`);
        }
        if(bus.ADHERENCE <0){
            marker.bindPopup(`<b>Bus Rt: ${bus.ROUTE} Bus ID:${bus.VEHICLE}</b><br> Currently ${Math.abs(bus.ADHERENCE)} minute\(s\) behind schedule`);
        }
        if(bus.ADHERENCE ==0){
            marker.bindPopup(`<b>Bus Rt: ${bus.ROUTE} Bus ID:${bus.VEHICLE}</b><br> Currently on schedule`);
        }
}
////////////////////////////////////
//// Twitter and Icon Resizing ////
//////////////////////////////////

$( window ).resize(function() {
    if($(window).width()>768){
        $(".navbar-brand").attr("src","images/bustalker.png");
        $(".twitter-timeline").remove();
        $("#tweets").prepend("<a class=\"twitter-timeline\" data-lang=\"en\" data-width=\"900\" data-height=\"10\" data-theme=\"dark\" data-link-color=\"#2B7BB9\" href=\"https://twitter.com/MARTASERVICE?ref_src=twsrc%5Etfw\">Tweets by MARTASERVICE</a> <script async src=\"https://platform.twitter.com/widgets.js\" charset=\"utf-8\"></script>");
    }
    if($(window).width()<768){
        $(".navbar-brand").attr("src","images/bustalkersmall.png");
        $(".twitter-timeline").remove();
        $("#tweets").prepend("<a class=\"twitter-timeline\" data-lang=\"en\" data-width=\"900\" data-height=\"10\" data-theme=\"dark\" data-link-color=\"#2B7BB9\" href=\"https://twitter.com/MARTASERVICE?ref_src=twsrc%5Etfw\">Tweets by MARTASERVICE</a> <script async src=\"https://platform.twitter.com/widgets.js\" charset=\"utf-8\"></script>");
    }
});


///////////////////////////////////
//// Weather App Functionality ////
//////////////////////////////////

function addTemp(temp) {
    const temperatureElement = document.createElement('p');
    temperatureElement.innerHTML = `<b>${temp.toFixed(0)}&#730;F</b>`;
    temperatureElement.setAttribute('style', 'font-size: 40px; font-weight: bold;'); 
    stats.append(temperatureElement);
}

function addPrecipitation(precipitation) {
    const precipitationElement = document.createElement('p');
    precipitationElement.innerHTML = `Chance of Rain: ${precipitation} &#37;`;
    precipitationElement.setAttribute('style', 'opacity: .5; font-size: 1rem;') 
    stats.append(precipitationElement);
}

function addIcon(icon) {
    // clear-day, clear-night, partly-cloudy-day,partly-cloudy-night,cloudy,rain,sleet,snow,wind,fog
    
    const iconElement = document.createElement('p');
    switch(icon) {
        case "clear-day":
            iconElement.innerHTML = `<img src="weatherIcons/sunny.png">`;
            iconStatus.append(iconElement);
            break;
        case "clear-night":
            iconElement.innerHTML = `<img src="weatherIcons/sunny.png">`;
            iconStatus.append(iconElement);
            break;
        case "partly-cloudy-day":
            iconElement.innerHTML = `<img src="weatherIcons/cloudy.png">`;
            iconStatus.append(iconElement);
            break;
        case "clear-partly-cloudy-night":
            iconElement.innerHTML = `<img src="weatherIcons/cloudy.png">`;
            iconStatus.append(iconElement);
            break;
        case "cloudy":
            iconElement.innerHTML = `<img src="weatherIcons/cloudy.png">`;
            iconStatus.append(iconElement);
            break;
        case "rain":
            iconElement.innerHTML = `<img src="weatherIcons/cloudyrain.png">`;
            iconStatus.append(iconElement);
            break;
        case "sleet":
            iconElement.innerHTML = `<img src="weatherIcons/sleet.png">`;
            iconStatus.append(iconElement);
            break;
        case "snow":
            iconElement.innerHTML = `<img src="weatherIcons/snow.png">`;
            iconStatus.append(iconElement);
            break;
        case "wind":
            iconElement.innerHTML = `<img src="weatherIcons/wind.png">`;
            iconStatus.append(iconElement);
            break;
        case "fog":
            iconElement.innerHTML = `<img src="weatherIcons/foggy.png">`;
            iconStatus.append(iconElement);
            break;
        default:
            iconElement.innerHTML = `<img src="weatherIcons/sunny.png">`;
            iconStatus.append(iconElement);
    }
}

function getWeather() {
    const url = `https://api.darksky.net/forecast/1010d61071e3e5e3e99eed847a82272c/33.7490,-84.3880`;

    get(url).then(function(response) {
        addTemp(response.currently.temperature);
        addPrecipitation(response.currently.precipProbability);
        addIcon(response.minutely.icon);
    });
}
getWeather();



