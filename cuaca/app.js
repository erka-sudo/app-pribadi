let lat = -2.1
let lon = 102.7

let map
let marker

/* ================= WEATHER ================= */

async function loadWeather(){

let url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover&timezone=auto`

let res=await fetch(url)
let data=await res.json()

let w=data.current

document.getElementById("temp").innerHTML=w.temperature_2m+"°C"
document.getElementById("location").innerHTML=lat.toFixed(3)+" , "+lon.toFixed(3)

document.getElementById("condition").innerHTML=getWeatherText(w.weather_code)

document.getElementById("wind").innerHTML=
`💨 ${w.wind_speed_10m} km/h • arah ${Math.round(w.wind_direction_10m)}°`

document.getElementById("rain").innerHTML=
`🌧 ${w.precipitation} mm`

document.getElementById("cloud").innerHTML=
`☁ ${w.cloud_cover}%`

document.getElementById("gust").innerHTML=
`⚡ gust ${w.wind_gusts_10m} km/h`

checkDrone(w)

}

/* ================= WEATHER TEXT ================= */

function getWeatherText(code){

const map={

0:"Cerah",
1:"Cerah Berawan",
2:"Berawan Sebagian",
3:"Berawan",

45:"Kabut",

51:"Gerimis",
61:"Hujan",
63:"Hujan",
65:"Hujan Lebat",

95:"Badai"

}

return map[code] || "Cuaca"

}

/* ================= DRONE ================= */

function checkDrone(w){

let el=document.getElementById("drone")

if(w.wind_speed_10m>20 || w.wind_gusts_10m>30 || w.precipitation>0.2){

el.innerHTML="⚠ Drone TIDAK AMAN"
el.className="notsafe"

}else{

el.innerHTML="✅ Drone AMAN"
el.className="safe"

}

}

/* ================= MAP ================= */

function initMap(){

map=new maplibregl.Map({

container:"map",

style:"https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",

center:[lon,lat],

zoom:7

})

marker=new maplibregl.Marker()
.setLngLat([lon,lat])
.addTo(map)

}

/* ================= LOCATION ================= */

function getGPS(){

navigator.geolocation.getCurrentPosition(pos=>{

lat=pos.coords.latitude
lon=pos.coords.longitude

map.setCenter([lon,lat])
marker.setLngLat([lon,lat])

loadWeather()

})

}

function enablePickLocation(){

alert("Klik lokasi di peta")

map.once("click",(e)=>{

lat=e.lngLat.lat
lon=e.lngLat.lng

marker.setLngLat([lon,lat])

loadWeather()

})

}

/* ================= INIT ================= */

initMap()
loadWeather()
