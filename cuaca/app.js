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

document.getElementById("rain").innerHTML=`🌧 ${w.precipitation} mm`
document.getElementById("cloud").innerHTML=`☁ ${w.cloud_cover}%`
document.getElementById("gust").innerHTML=`⚡ gust ${w.wind_gusts_10m} km/h`

checkDrone(w)

/* 🔥 tambah penjelasan */
generateExplanation(w)

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
61:"Hujan Ringan",
63:"Hujan",
65:"Hujan Lebat",
95:"Potensi Badai"
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

/* ================= PENJELASAN ================= */

function generateExplanation(w){

let main = ""
let list = []

/* MAIN SUMMARY */

if(w.precipitation > 0.5){

main = "Saat ini terjadi hujan dengan intensitas ringan hingga sedang."

}else if(w.cloud_cover > 80){

main = "Langit tertutup awan tebal, cahaya matahari sangat terbatas."

}else if(w.cloud_cover > 50){

main = "Kondisi cukup berawan dengan cahaya matahari berkurang."

}else{

main = "Cuaca relatif cerah dengan cahaya matahari cukup kuat."

}

/* DETAIL */

list.push(`Suhu udara ${w.temperature_2m}°C tergolong normal untuk wilayah tropis.`)

list.push(`Kecepatan angin ${w.wind_speed_10m} km/h dari arah ${Math.round(w.wind_direction_10m)}° termasuk ${getWindLevel(w.wind_speed_10m)}.`)

list.push(`Hembusan maksimum (gust) mencapai ${w.wind_gusts_10m} km/h.`)

list.push(`Curah hujan ${w.precipitation} mm menunjukkan ${getRainLevel(w.precipitation)}.`)

list.push(`Tutupan awan ${w.cloud_cover}% menyebabkan intensitas cahaya ${getLightLevel(w.cloud_cover)}.`)

/* OUTPUT */

document.getElementById("descMain").innerText = main

let ul = document.getElementById("descList")
ul.innerHTML = ""

list.forEach(text=>{
let li = document.createElement("li")
li.innerText = text
ul.appendChild(li)
})

}

/* ================= INTERPRETASI ================= */

function getWindLevel(wind){
if(wind < 5) return "sangat lemah"
if(wind < 15) return "lemah"
if(wind < 25) return "sedang"
return "kuat"
}

function getRainLevel(rain){
if(rain < 0.1) return "tidak ada hujan"
if(rain < 0.5) return "gerimis ringan"
if(rain < 2) return "hujan ringan"
return "hujan sedang"
}

function getLightLevel(cloud){
if(cloud < 20) return "sangat tinggi (terik)"
if(cloud < 50) return "cukup terang"
if(cloud < 80) return "redup"
return "rendah (tertutup awan)"
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

map.on("load",()=>{
setTimeout(()=>{ map.resize() },200)
})

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

window.onload = () => {

initMap()
loadWeather()

}
