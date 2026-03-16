let lat = -2.1
let lon = 102.7

let map
let marker
let weatherData

async function loadWeather(){

let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,cloudcover&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&current_weather=true&timezone=auto&forecast_days=7`

let res = await fetch(url)

weatherData = await res.json()

document.getElementById("temp").innerHTML =
weatherData.current_weather.temperature + "°C"

document.getElementById("condition").innerHTML =
"Wind " + weatherData.current_weather.windspeed + " km/h"

document.getElementById("location").innerHTML =
lat.toFixed(3) + " , " + lon.toFixed(3)

showMode("hourly")

}

function showMode(mode){

let container = document.getElementById("forecast")

container.innerHTML = ""

if(mode==="hourly"){

for(let i=0;i<12;i++){

createCard(
weatherData.hourly.time[i],
weatherData.hourly.temperature_2m[i],
weatherData.hourly.precipitation[i]
)

}

}

if(mode==="3hour"){

for(let i=0;i<24;i+=3){

createCard(
weatherData.hourly.time[i],
weatherData.hourly.temperature_2m[i],
weatherData.hourly.precipitation[i]
)

}

}

if(mode==="6hour"){

for(let i=0;i<48;i+=6){

createCard(
weatherData.hourly.time[i],
weatherData.hourly.temperature_2m[i],
weatherData.hourly.precipitation[i]
)

}

}

if(mode==="daily"){

for(let i=0;i<7;i++){

let card = document.createElement("div")

card.className="col-md-2 forecast-card"

card.innerHTML = `

<h6>${weatherData.daily.time[i]}</h6>

<div>🌡 ${weatherData.daily.temperature_2m_max[i]}°C</div>

<div>🌧 ${weatherData.daily.precipitation_sum[i]} mm</div>

`

container.appendChild(card)

}

}

}

function createCard(time,temp,rain){

let container = document.getElementById("forecast")

let card = document.createElement("div")

card.className="col-md-2 forecast-card"

card.innerHTML=`

<h6>${time.slice(11,16)}</h6>

<div>🌡 ${temp}°C</div>

<div>🌧 ${rain} mm</div>

`

container.appendChild(card)

}

function getGPS(){

if(!navigator.geolocation){

alert("Browser tidak mendukung GPS")

return

}

navigator.geolocation.getCurrentPosition(pos=>{

lat = pos.coords.latitude
lon = pos.coords.longitude

map.setCenter([lon,lat])

marker.setLngLat([lon,lat])

loadWeather()

})

}

function enablePickLocation(){

alert("Klik lokasi pada peta")

map.once("click",(e)=>{

lat = e.lngLat.lat
lon = e.lngLat.lng

marker.setLngLat([lon,lat])

loadWeather()

})

}

function initMap(){

map = new maplibregl.Map({

container:'map',

style:'https://demotiles.maplibre.org/style.json',

center:[lon,lat],

zoom:5

})

marker = new maplibregl.Marker()

.setLngLat([lon,lat])

.addTo(map)

map.on("load",()=>{

map.addSource("rain",{

type:"raster",

tiles:[
"https://tilecache.rainviewer.com/v2/radar/latest/256/{z}/{x}/{y}/2/1_1.png"
],

tileSize:256

})

map.addLayer({

id:"rain-layer",

type:"raster",

source:"rain",

paint:{'raster-opacity':0.6}

})

})

}

loadWeather()

initMap()
