let lat = -2.1
let lon = 102.7

let map
let marker
let weatherData = null
let currentMode = "wind"
let rainFramePath = null
let animationId = null

const canvas = document.getElementById("weatherCanvas")
const ctx = canvas.getContext("2d")

let particles = []

/* ================= HELPERS ================= */

function qs(id){
return document.getElementById(id)
}

function clamp(value,min,max){
return Math.max(min,Math.min(max,value))
}

function formatCoord(value){
return Number(value).toFixed(3)
}

function degToRad(deg){
return deg * Math.PI / 180
}

function weatherText(code){
const mapCode = {
0:"Cerah",
1:"Cerah Berawan",
2:"Berawan Sebagian",
3:"Berawan",
45:"Berkabut",
48:"Kabut Tebal",
51:"Gerimis Ringan",
53:"Gerimis",
55:"Gerimis Lebat",
56:"Gerimis Beku Ringan",
57:"Gerimis Beku Lebat",
61:"Hujan Ringan",
63:"Hujan",
65:"Hujan Lebat",
66:"Hujan Beku Ringan",
67:"Hujan Beku Lebat",
71:"Salju Ringan",
73:"Salju",
75:"Salju Lebat",
77:"Butiran Salju",
80:"Hujan Lokal Ringan",
81:"Hujan Lokal",
82:"Hujan Lokal Lebat",
85:"Salju Lokal Ringan",
86:"Salju Lokal Lebat",
95:"Badai Petir",
96:"Badai Petir + Hujan Es Ringan",
99:"Badai Petir + Hujan Es Lebat"
}
return mapCode[code] || "Kondisi Tidak Diketahui"
}

function getRainStatus(current){
const precipitation = Number(current.precipitation || 0)
const weatherCode = Number(current.weather_code)

if (precipitation > 0.05) return "Sedang Hujan"
if ([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(weatherCode)) return "Berpotensi / indikasi hujan"
if ([45,48].includes(weatherCode)) return "Berkabut"
if ([1,2,3].includes(weatherCode)) return "Berawan"
if (weatherCode === 0) return "Cerah"
return weatherText(weatherCode)
}

function getDroneStatus(current){
const wind = Number(current.wind_speed_10m || 0)
const gust = Number(current.wind_gusts_10m || 0)
const precipitation = Number(current.precipitation || 0)

if (gust >= 30 || wind >= 20 || precipitation > 0.2){
return {
text:"⚠ Drone TIDAK AMAN diterbangkan",
className:"notsafe"
}
}

return {
text:"✅ Drone AMAN diterbangkan",
className:"safe"
}
}

/* ================= WEATHER ================= */

async function loadWeather(){
try{

qs("loadingText").textContent = "Memuat data cuaca..."

let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover&timezone=auto`

let res = await fetch(url)
if(!res.ok) throw new Error("Gagal mengambil data cuaca")

weatherData = await res.json()

const current = weatherData.current

qs("location").textContent = `${formatCoord(lat)} , ${formatCoord(lon)}`
qs("temp").textContent = `${current.temperature_2m}°C`
qs("condition").textContent = weatherText(current.weather_code)
qs("wind").textContent = `💨 ${current.wind_speed_10m} km/h • arah ${Math.round(current.wind_direction_10m)}°`
qs("rainStatus").textContent = `🌧 ${getRainStatus(current)}`
qs("cloudStatus").textContent = `☁ Tutupan awan ${current.cloud_cover}%`
qs("gustStatus").textContent = `⚡ Gust ${current.wind_gusts_10m} km/h`

const droneStatus = getDroneStatus(current)
qs("drone").textContent = droneStatus.text
qs("drone").className = droneStatus.className

updateModeInfo()

initParticlesFromWeather()
resizeCanvas()
startAnimation()

qs("loadingText").textContent = ""

}catch(err){
console.error(err)
qs("loadingText").textContent = "Gagal memuat data cuaca"
}
}

function updateModeInfo(){
if(!weatherData) return

const current = weatherData.current

if(currentMode === "wind"){
qs("modeInfo").textContent =
`Mode angin real • ${current.wind_speed_10m} km/h • arah ${Math.round(current.wind_direction_10m)}°`
}else{
qs("modeInfo").textContent =
`Mode hujan real • ${getRainStatus(current)} • presipitasi ${current.precipitation} mm`
}
}

/* ================= MAP ================= */

function buildTopoStyle(){
return {
version: 8,
sources: {
"topo": {
type: "raster",
tiles: [
"https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
"https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
"https://c.tile.opentopomap.org/{z}/{x}/{y}.png"
],
tileSize: 256,
attribution: "© OpenTopoMap © OpenStreetMap contributors"
}
},
layers: [
{
id: "topo",
type: "raster",
source: "topo"
}
]
}
}

function initMap(){
map = new maplibregl.Map({
container: "map",
style: buildTopoStyle(),
center: [lon,lat],
zoom: 7
})

marker = new maplibregl.Marker({
color: "#00c2ff"
})
.setLngLat([lon,lat])
.addTo(map)

map.addControl(new maplibregl.NavigationControl(), "top-right")

map.on("load", async ()=>{
resizeCanvas()
await addRainLayer()
syncCanvasToMap()
})

map.on("move", syncCanvasToMap)
map.on("zoom", syncCanvasToMap)
map.on("resize", syncCanvasToMap)
}

async function addRainLayer(){
try{
const res = await fetch("https://api.rainviewer.com/public/weather-maps.json")
if(!res.ok) throw new Error("Gagal mengambil frame RainViewer")

const data = await res.json()

let latestPath = null

if (data.radar && Array.isArray(data.radar.past) && data.radar.past.length){
latestPath = data.radar.past[data.radar.past.length - 1].path
} else if (data.radar && Array.isArray(data.radar.nowcast) && data.radar.nowcast.length){
latestPath = data.radar.nowcast[0].path
}

if(!latestPath){
console.warn("Frame radar tidak ditemukan")
return
}

rainFramePath = latestPath

const rainTiles = [
`https://tilecache.rainviewer.com${rainFramePath}/256/{z}/{x}/{y}/2/1_1.png`
]

if(map.getSource("rain-source")){
return
}

map.addSource("rain-source",{
type:"raster",
tiles: rainTiles,
tileSize:256,
attribution:"RainViewer"
})

map.addLayer({
id:"rain-layer",
type:"raster",
source:"rain-source",
paint:{
"raster-opacity":0.75
},
layout:{
visibility:"none"
}
})

}catch(err){
console.error(err)
}
}

/* ================= MODE ================= */

function setMode(mode){
currentMode = mode

document.querySelectorAll(".mode-btn").forEach(btn=>{
btn.classList.remove("active-mode")
})

if(mode === "wind"){
qs("btnWind").classList.add("active-mode")
}else{
qs("btnRain").classList.add("active-mode")
}

if(map && map.getLayer("rain-layer")){
map.setLayoutProperty(
"rain-layer",
"visibility",
mode === "rain" ? "visible" : "none"
)
}

updateModeInfo()
initParticlesFromWeather()
startAnimation()
}

/* ================= PARTICLES ================= */

function initParticlesFromWeather(){
particles = []

if(!weatherData) return

const current = weatherData.current
const windSpeed = Number(current.wind_speed_10m || 0)
const count = currentMode === "wind"
? clamp(Math.round(120 + windSpeed * 8), 120, 320)
: clamp(Math.round(80 + Number(current.precipitation || 0) * 220), 80, 260)

for(let i=0;i<count;i++){
particles.push(resetParticle(true))
}
}

function resetParticle(randomAnywhere = false){
const rect = canvas.getBoundingClientRect()
const width = rect.width || canvas.width || 1000
const height = rect.height || canvas.height || 500

if(currentMode === "wind"){
return {
x: randomAnywhere ? Math.random() * width : -20,
y: Math.random() * height,
len: 6 + Math.random() * 12,
alpha: 0.25 + Math.random() * 0.45,
life: 50 + Math.random() * 100
}
}

return {
x: Math.random() * width,
y: randomAnywhere ? Math.random() * height : -20,
len: 10 + Math.random() * 18,
alpha: 0.25 + Math.random() * 0.55,
life: 40 + Math.random() * 80
}
}

function startAnimation(){
if(animationId){
cancelAnimationFrame(animationId)
animationId = null
}
animate()
}

function animate(){
ctx.clearRect(0,0,canvas.width,canvas.height)

if(weatherData){
if(currentMode === "wind"){
drawWindParticles()
}else{
drawRainParticles()
}
}

animationId = requestAnimationFrame(animate)
}

function drawWindParticles(){
const current = weatherData.current
const speed = Number(current.wind_speed_10m || 0)
const direction = Number(current.wind_direction_10m || 0)

const pxPerFrame = clamp(speed * 0.18, 0.8, 8)

const angle = degToRad(direction - 90)
const vx = Math.cos(angle) * pxPerFrame
const vy = Math.sin(angle) * pxPerFrame

for(let i=0;i<particles.length;i++){
const p = particles[i]

ctx.beginPath()
ctx.strokeStyle = `rgba(255,255,255,${p.alpha})`
ctx.lineWidth = 1.2
ctx.moveTo(p.x,p.y)
ctx.lineTo(p.x + vx * p.len,p.y + vy * p.len)
ctx.stroke()

p.x += vx
p.y += vy
p.life -= 1

if(
p.x < -30 || p.x > canvas.width + 30 ||
p.y < -30 || p.y > canvas.height + 30 ||
p.life <= 0
){
particles[i] = resetParticle(false)
}
}
}

function drawRainParticles(){
const current = weatherData.current
const intensity = Number(current.precipitation || 0)
const windDirection = Number(current.wind_direction_10m || 0)
const windSpeed = Number(current.wind_speed_10m || 0)

const fall = clamp(4 + intensity * 8, 4, 18)
const drift = clamp(windSpeed * 0.05, 0, 2.2)
const angle = degToRad(windDirection - 90)
const vx = Math.cos(angle) * drift
const vy = Math.max(fall, Math.abs(Math.sin(angle) * drift) + fall)

for(let i=0;i<particles.length;i++){
const p = particles[i]

ctx.beginPath()
ctx.strokeStyle = `rgba(120,190,255,${p.alpha})`
ctx.lineWidth = 1.2
ctx.moveTo(p.x,p.y)
ctx.lineTo(p.x + vx * 0.8,p.y + p.len)
ctx.stroke()

p.x += vx
p.y += vy
p.life -= 1

if(
p.y > canvas.height + 30 ||
p.x < -30 || p.x > canvas.width + 30 ||
p.life <= 0
){
particles[i] = resetParticle(false)
}
}
}

/* ================= CANVAS OVER MAP ================= */

function resizeCanvas(){
const mapEl = qs("map")
const rect = mapEl.getBoundingClientRect()

canvas.width = Math.max(1, Math.floor(rect.width))
canvas.height = Math.max(1, Math.floor(rect.height))
canvas.style.width = rect.width + "px"
canvas.style.height = rect.height + "px"

syncCanvasToMap()
}

function syncCanvasToMap(){
const mapEl = qs("map")
const wrapEl = qs("mapWrap")
const mapRect = mapEl.getBoundingClientRect()
const wrapRect = wrapEl.getBoundingClientRect()

canvas.style.left = (mapRect.left - wrapRect.left) + "px"
canvas.style.top = (mapRect.top - wrapRect.top) + "px"
}

/* ================= LOCATION ================= */

function updateLocationOnMap(){
if(!map || !marker) return
map.setCenter([lon,lat])
marker.setLngLat([lon,lat])
}

function getGPS(){
if(!navigator.geolocation){
alert("Browser tidak mendukung GPS")
return
}

navigator.geolocation.getCurrentPosition(
async pos=>{
lat = pos.coords.latitude
lon = pos.coords.longitude
updateLocationOnMap()
await loadWeather()
},
err=>{
console.error(err)
alert("Gagal mengambil lokasi GPS")
},
{
enableHighAccuracy:true,
timeout:10000,
maximumAge:0
}
)
}

function enablePickLocation(){
alert("Klik lokasi pada peta")

map.once("click", async e=>{
lat = e.lngLat.lat
lon = e.lngLat.lng
updateLocationOnMap()
await loadWeather()
})
}

/* ================= INIT ================= */

window.addEventListener("resize", resizeCanvas)

initMap()
loadWeather()
