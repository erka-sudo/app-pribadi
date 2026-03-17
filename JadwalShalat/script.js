/* ================= GLOBAL ================= */

let lat = 0
let lon = 0

let timesToday = {}

let qiblaDirection = 0
let heading = 0

let marker = null
let selectedPoint = null

let directionMarker = null
let directionElement = null

let compassStarted = false

/* offset hasil kalibrasi */
let compassOffset = 0

/* smoothing */
let smoothHeading = 0

/* ================= MAP ================= */

let map = new maplibregl.Map({
container: "map",
style: {
version: 8,
sources: {
esri: {
type: "raster",
tiles: [
"https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
],
tileSize: 256
},
osmLabels:{
type:"raster",
tiles:[
"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
],
tileSize:256
}
},
layers: [
{ id: "esri", type: "raster", source: "esri" },
{
id:"osm-labels",
type:"raster",
source:"osmLabels",
paint:{ "raster-opacity":0.6 }
}
]
},
center: [110, -2],
zoom: 5
})

map.on("click", e => {

selectedPoint = e.lngLat

if (marker) marker.remove()

marker = new maplibregl.Marker()
.setLngLat(e.lngLat)
.addTo(map)

})

function getGPS() {
navigator.geolocation.getCurrentPosition(pos => {
setLocation(pos.coords.latitude, pos.coords.longitude)
})
}

function useMapPoint() {
if (!selectedPoint) return
setLocation(selectedPoint.lat, selectedPoint.lng)
}

function setLocation(a, b) {

lat = a
lon = b

map.flyTo({ center: [lon, lat], zoom: 14 })

document.getElementById("locationText").innerText =
"Lokasi: " + lat.toFixed(5) + "," + lon.toFixed(5)

/* marker lokasi */
if(marker) marker.remove()

marker = new maplibregl.Marker()
.setLngLat([lon,lat])
.addTo(map)

/* marker arah */
if(directionMarker) directionMarker.remove()

directionElement = document.createElement("div")
directionElement.className="directionArrow"

directionMarker = new maplibregl.Marker({
element:directionElement
})
.setLngLat([lon,lat])
.addTo(map)

/* hitung ulang */
calculatePrayerTimes(new Date())
calculateQibla()

/* start kompas sekali saja */
startCompass()
}

/* ================= MATEMATIKA ================= */

function deg2rad(d) { return d * Math.PI / 180 }
function rad2deg(r) { return r * 180 / Math.PI }

function dayOfYear(d) {
let start = new Date(d.getFullYear(), 0, 0)
return Math.floor((d - start) / 86400000)
}

function solarDeclination(n) {
return 23.45 * Math.sin(deg2rad((360 / 365) * (284 + n)))
}

function equationOfTime(n) {
let B = deg2rad((360 / 365) * (n - 81))
return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

function hourAngle(lat, dec, angle) {
let num = Math.sin(deg2rad(angle)) - Math.sin(deg2rad(lat)) * Math.sin(deg2rad(dec))
let den = Math.cos(deg2rad(lat)) * Math.cos(deg2rad(dec))
return rad2deg(Math.acos(num / den))
}

/* ================= SHALAT ================= */

function calculatePrayerTimes(date) {

let n = dayOfYear(date)
let dec = solarDeclination(n)
let eot = equationOfTime(n)
let tz = -date.getTimezoneOffset() / 60

let dhuhr = 12 + (tz * 15 - lon) / 15 - eot / 60

let fajrAngle = -20
let ishaAngle = -18
let sunriseAngle = -0.833

let fajr = dhuhr - hourAngle(lat, dec, fajrAngle) / 15
let sunrise = dhuhr - hourAngle(lat, dec, sunriseAngle) / 15
let maghrib = dhuhr + hourAngle(lat, dec, sunriseAngle) / 15
let isha = dhuhr + hourAngle(lat, dec, ishaAngle) / 15

let latRad = deg2rad(lat)
let decRad = deg2rad(dec)

let g = Math.abs(latRad - decRad)
let asrAngle = rad2deg(Math.atan(1 / (1 + Math.tan(g))))
let asr = dhuhr + hourAngle(lat, dec, asrAngle) / 15

function format(t) {
let h = Math.floor(t)
let m = Math.floor((t - h) * 60)
return ("0" + h).slice(-2) + ":" + ("0" + m).slice(-2)
}

timesToday = {
fajr: format(fajr),
sunrise: format(sunrise),
dhuhr: format(dhuhr),
asr: format(asr),
maghrib: format(maghrib),
isha: format(isha)
}

/* update tampilan */
for (let id in timesToday) {
if (document.getElementById(id))
document.getElementById(id).innerText = timesToday[id]
}

/* mode masjid */
document.getElementById("mfajr").innerText = timesToday.fajr
document.getElementById("msunrise").innerText = timesToday.sunrise
document.getElementById("mdhuhr").innerText = timesToday.dhuhr
document.getElementById("masr").innerText = timesToday.asr
document.getElementById("mmaghrib").innerText = timesToday.maghrib
document.getElementById("misha").innerText = timesToday.isha

highlightPrayer()
}

/* ================= HIGHLIGHT ================= */

function highlightPrayer() {

let now = new Date()
let current = now.getHours() + ":" + now.getMinutes()

let order = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]

for (let id of order) {

let cell = document.getElementById(id)
if (!cell) continue

if (current >= timesToday[id]) {

document.querySelectorAll("#prayTable td")
.forEach(td => td.classList.remove("activePrayer"))

cell.classList.add("activePrayer")
}
}
}

/* ================= CLOCK MASJID ================= */

setInterval(() => {

let now = new Date()

let h = now.getHours().toString().padStart(2, "0")
let m = now.getMinutes().toString().padStart(2, "0")
let s = now.getSeconds().toString().padStart(2, "0")

document.getElementById("masjidClock").innerText =
h + ":" + m + ":" + s

}, 1000)

function openMasjidMode() {
document.getElementById("masjidMode").style.display = "block"
}

function closeMasjidMode() {
document.getElementById("masjidMode").style.display = "none"
}

/* ================= KIBLAT ================= */

function calculateQibla() {

const KAABA_LAT = 21.4225
const KAABA_LON = 39.8262

let dLon = deg2rad(KAABA_LON - lon)

let y = Math.sin(dLon) * Math.cos(deg2rad(KAABA_LAT))

let x =
Math.cos(deg2rad(lat)) * Math.sin(deg2rad(KAABA_LAT)) -
Math.sin(deg2rad(lat)) * Math.cos(deg2rad(KAABA_LAT)) * Math.cos(dLon)

qiblaDirection = (rad2deg(Math.atan2(y, x)) + 360) % 360

document.getElementById("qiblaAngle").innerText =
"Arah Kiblat " + qiblaDirection.toFixed(1) + "°"

}

/* ================= KOMPAS STABIL FINAL ================= */

function startCompass() {

if (compassStarted) return
compassStarted = true

window.addEventListener("deviceorientationabsolute", handleOrientation, true)
window.addEventListener("deviceorientation", handleOrientation, true)

}

function handleOrientation(event){

let raw = null

if (event.webkitCompassHeading !== undefined) {
raw = event.webkitCompassHeading
}
else if (event.absolute === true && event.alpha !== null) {
raw = 360 - event.alpha
}
else if (event.alpha !== null) {
raw = 360 - event.alpha
}

if (raw === null) return

/* crossing 360 */
let delta = raw - heading
if (delta > 180) delta -= 360
if (delta < -180) delta += 360

/* smoothing stabil */
heading = heading + delta * 0.15

/* apply kalibrasi */
heading = (heading + compassOffset + 360) % 360

document.getElementById("headingText").innerText =
"Arah Kompas " + heading.toFixed(1) + "°"

updateCompass()
}

/* ================= UPDATE VISUAL ================= */

function updateCompass(){

smoothHeading = smoothHeading + (heading - smoothHeading) * 0.2

let headingCSS = smoothHeading - 90

let needle = document.getElementById("needle")
if (needle) {
needle.style.transform =
"translateX(-50%) rotate(" + headingCSS + "deg)"
}

let relativeQibla = (qiblaDirection - smoothHeading + 360) % 360
let qiblaCSS = relativeQibla - 90

let qArrow = document.getElementById("qiblaArrow")
if (qArrow) {
qArrow.style.transform =
"translateX(-50%) rotate(" + qiblaCSS + "deg)"
}

if(directionElement){
directionElement.style.transform="rotate("+relativeQibla+"deg)"
}

}

/* ================= KALIBRASI ================= */

function calibrateCompass() {

compassOffset = (360 - heading) % 360

alert("Kalibrasi OK")

}

/* ================= HIJRI ================= */

function hijri(date){
return new Intl.DateTimeFormat(
'id-TN-u-ca-islamic',
{day:'numeric',month:'long',year:'numeric'}
).format(date)
}

/* ================= BULANAN ================= */

function openMonthly(){
document.getElementById("monthlyModal").style.display="block"
generateMonthly()
}

function closeMonthly(){
document.getElementById("monthlyModal").style.display="none"
}

function generateMonthly(){

let tbody=document.querySelector("#monthlyTable tbody")
tbody.innerHTML=""

let now=new Date()
let today=now.getDate()
let year=now.getFullYear()
let month=now.getMonth()

let days=new Date(year,month+1,0).getDate()

for(let d=1; d<=days; d++){

let date=new Date(year,month,d)
calculatePrayerTimes(date)

/* syuruq +15 menit */
let sunrise=timesToday.sunrise.split(":")
let srMin=parseInt(sunrise[0])*60+parseInt(sunrise[1])+15

let srH=Math.floor(srMin/60).toString().padStart(2,"0")
let srM=(srMin%60).toString().padStart(2,"0")

let syuruq=srH+":"+srM

let tr=document.createElement("tr")

let hari=date.toLocaleDateString("id-ID",{weekday:"long"})

tr.innerHTML=`
<td>${hari}</td>
<td>${date.getDate()}-${month+1}-${year}</td>
<td>${hijri(date)}</td>
<td>${timesToday.fajr}</td>
<td>${syuruq}</td>
<td>${timesToday.dhuhr}</td>
<td>${timesToday.asr}</td>
<td>${timesToday.maghrib}</td>
<td>${timesToday.isha}</td>
`

if(d === today){
tr.classList.add("highlightToday")
}

tbody.appendChild(tr)
}

}
