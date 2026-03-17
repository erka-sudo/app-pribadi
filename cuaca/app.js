let lat=-2.1
let lon=102.7

let map
let marker
let weatherData

/* ================= WEATHER ================= */

async function loadWeather(){

let url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,cloudcover,windspeed_10m,windgusts_10m,winddirection_10m,weathercode&current_weather=true&timezone=auto&forecast_days=7`

let res=await fetch(url)

weatherData=await res.json()

let temp=weatherData.current_weather.temperature
let wind=weatherData.current_weather.windspeed

document.getElementById("temp").innerHTML=temp+"°C"

document.getElementById("condition").innerHTML=
decodeWeather(weatherData.current_weather.weathercode)

document.getElementById("wind").innerHTML=
"💨 Wind "+wind+" km/h"

document.getElementById("location").innerHTML=
lat.toFixed(3)+" , "+lon.toFixed(3)

checkDroneSafety(temp,wind)

showMode("hourly")

}

/* ================= DRONE SAFETY ================= */

function checkDroneSafety(temp,wind){

let el=document.getElementById("drone")

if(wind>25){

el.innerHTML="⚠ Drone NOT SAFE (Wind too strong)"
el.className="notsafe"

}else{

el.innerHTML="✅ Drone SAFE to Fly"
el.className="safe"

}

}

/* ================= WEATHER CODE ================= */

function decodeWeather(code){

const w={

0:"☀ Clear sky",
1:"🌤 Mostly clear",
2:"⛅ Partly cloudy",
3:"☁ Cloudy",

45:"🌫 Fog",

51:"🌦 Drizzle",
53:"🌦 Drizzle",

61:"🌧 Rain",
63:"🌧 Rain",
65:"🌧 Heavy rain",

95:"⛈ Thunderstorm"

}

return w[code] || "Weather"

}

/* ================= FORECAST ================= */

function showMode(mode){

let container=document.getElementById("forecast")

container.innerHTML=""

let now=new Date()

let startIndex=weatherData.hourly.time.findIndex(t=>{
return new Date(t)>=now
})

let step=1

if(mode==="3hour") step=3
if(mode==="6hour") step=6

for(let i=startIndex;i<startIndex+24;i+=step){

createCard(
weatherData.hourly.time[i],
weatherData.hourly.temperature_2m[i],
weatherData.hourly.precipitation[i],
weatherData.hourly.windspeed_10m[i],
weatherData.hourly.windgusts_10m[i],
weatherData.hourly.cloudcover[i]
)

}

}

/* ================= CARD ================= */

function createCard(time,temp,rain,wind,gust,cloud){

let container=document.getElementById("forecast")

let card=document.createElement("div")

card.className="col-md-2 forecast-card"

card.innerHTML=`

<h6>${time.slice(11,16)}</h6>

<div>🌡 ${temp}°C</div>

<div>🌧 ${rain} mm</div>

<div>💨 ${wind} km/h</div>

<div>⚡ gust ${gust}</div>

<div>☁ ${cloud}%</div>

`

container.appendChild(card)

}

/* ================= GPS ================= */

function getGPS(){

navigator.geolocation.getCurrentPosition(pos=>{

lat=pos.coords.latitude
lon=pos.coords.longitude

map.setCenter([lon,lat])
marker.setLngLat([lon,lat])

loadWeather()

})

}

/* ================= PICK LOCATION ================= */

function enablePickLocation(){

alert("Klik lokasi pada peta")

map.once("click",(e)=>{

lat=e.lngLat.lat
lon=e.lngLat.lng

marker.setLngLat([lon,lat])

loadWeather()

})

}

/* ================= MAP ================= */

function initMap(){

map=new maplibregl.Map({

container:"map",

style:"https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",

center:[lon,lat],

zoom:6

})

marker=new maplibregl.Marker()
.setLngLat([lon,lat])
.addTo(map)

map.on("load",()=>{

map.addSource("radar",{

type:"raster",

tiles:[
"https://tilecache.rainviewer.com/v2/radar/latest/256/{z}/{x}/{y}/2/1_1.png"
],

tileSize:256

})

map.addLayer({

id:"radar",

type:"raster",

source:"radar",

paint:{'raster-opacity':0.65}

})

})

}

/* ================= INIT ================= */

loadWeather()
initMap()
