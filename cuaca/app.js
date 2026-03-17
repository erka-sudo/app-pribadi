let lat=-2.1
let lon=102.7

let map
let marker

let windSpeed=0
let windDir=0

let mode="wind"

let canvas=document.getElementById("windCanvas")
let ctx=canvas.getContext("2d")

let particles=[]

/* ================= WEATHER ================= */

async function loadWeather(){

let url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`

let res=await fetch(url)
let data=await res.json()

let w=data.current_weather

windSpeed=w.windspeed
windDir=w.winddirection

document.getElementById("temp").innerHTML=w.temperature+"°C"
document.getElementById("wind").innerHTML="💨 "+windSpeed+" km/h"
document.getElementById("location").innerHTML=lat.toFixed(3)+","+lon.toFixed(3)
document.getElementById("condition").innerHTML="Weather"

checkDrone(windSpeed)

initParticles()

}

/* ================= PARTICLES ================= */

function initParticles(){

particles=[]

for(let i=0;i<200;i++){

particles.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height
})

}

}

/* ================= ANIMATION ================= */

function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height)

if(mode==="wind") drawWind()
if(mode==="rain") drawRain()

requestAnimationFrame(animate)

}

function drawWind(){

let angle=(windDir-90)*Math.PI/180

let vx=Math.cos(angle)*windSpeed*0.05
let vy=Math.sin(angle)*windSpeed*0.05

ctx.strokeStyle="rgba(0,200,255,0.7)"

particles.forEach(p=>{

ctx.beginPath()
ctx.moveTo(p.x,p.y)
ctx.lineTo(p.x+vx*2,p.y+vy*2)
ctx.stroke()

p.x+=vx
p.y+=vy

if(p.x<0||p.x>canvas.width||p.y<0||p.y>canvas.height){
p.x=Math.random()*canvas.width
p.y=Math.random()*canvas.height
}

})

}

function drawRain(){

ctx.strokeStyle="rgba(0,150,255,0.7)"

particles.forEach(p=>{

ctx.beginPath()
ctx.moveTo(p.x,p.y)
ctx.lineTo(p.x,p.y+10)
ctx.stroke()

p.y+=5

if(p.y>canvas.height){
p.y=0
p.x=Math.random()*canvas.width
}

})

}

/* ================= MAP ================= */

function initMap(){

map=new maplibregl.Map({
container:"map",
style:"https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
center:[lon,lat],
zoom:5
})

marker=new maplibregl.Marker().setLngLat([lon,lat]).addTo(map)

map.on("load",()=>{

map.addSource("rain",{
type:"raster",
tiles:["https://tilecache.rainviewer.com/v2/radar/latest/256/{z}/{x}/{y}/2/1_1.png"],
tileSize:256
})

map.addLayer({
id:"rain",
type:"raster",
source:"rain",
paint:{'raster-opacity':0.6},
layout:{visibility:"none"}
})

resizeCanvas()

})

}

/* ================= MODE ================= */

function setMode(m){

mode=m

if(m==="rain"){
map.setLayoutProperty("rain","visibility","visible")
}else{
map.setLayoutProperty("rain","visibility","none")
}

}

/* ================= CANVAS ================= */

function resizeCanvas(){

let rect=document.getElementById("map").getBoundingClientRect()

canvas.width=rect.width
canvas.height=rect.height

canvas.style.top=rect.top+"px"
canvas.style.left=rect.left+"px"

}

/* ================= DRONE ================= */

function checkDrone(wind){

let el=document.getElementById("drone")

if(wind>25){
el.innerHTML="⚠ NOT SAFE"
el.className="notsafe"
}else{
el.innerHTML="✅ SAFE"
el.className="safe"
}

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

/* ================= INIT ================= */

initMap()
loadWeather()
animate()

window.addEventListener("resize",resizeCanvas)
