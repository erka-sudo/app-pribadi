let lastHeading = null
let unstableCount = 0
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
let compassOffset = 0

let map = null

/* ================= INIT ================= */

window.onload = function () {
initMap()
}

/* ================= MAP ================= */

function initMap(){

map = new maplibregl.Map({
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

}

/* ================= VALIDASI ================= */

function checkLocation() {
if (lat === 0 && lon === 0) {
alert("Silakan tentukan lokasi terlebih dahulu")
return false
}
return true
}

/* ================= UI ================= */

function openMasjidMode() {

document.getElementById("masjidMode").style.display="block"

/* jika belum ada lokasi */
if (lat === 0 && lon === 0) {

alert("Lokasi belum ditentukan.\nGunakan GPS atau pilih dari peta.")

let clock = document.getElementById("masjidClock")
if(clock){
clock.innerText = "LOKASI BELUM DISET"
}

return
}

/* jika ada lokasi */
calculatePrayerTimes(new Date())
}

function closeMasjidMode(){
document.getElementById("masjidMode").style.display="none"
}

function useMapPoint() {
if (!selectedPoint) {
alert("Klik peta dulu")
return
}
setLocation(selectedPoint.lat, selectedPoint.lng)
}

/* ================= GPS ================= */

function getGPS() {
navigator.geolocation.getCurrentPosition(pos => {
setLocation(pos.coords.latitude, pos.coords.longitude)
})
}

/* ================= SET LOCATION ================= */

function setLocation(a, b) {

lat = a
lon = b

if(map){
map.flyTo({ center: [lon, lat], zoom: 14 })
}

let locEl = document.getElementById("locationText")
if(locEl){
locEl.innerText = "Lokasi: " + lat.toFixed(5) + "," + lon.toFixed(5)
}

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

/* update */
calculatePrayerTimes(new Date())
calculateQibla()
startCompass()
}

/* ================= MATH ================= */

function deg2rad(d){return d*Math.PI/180}
function rad2deg(r){return r*180/Math.PI}

function dayOfYear(d){
let start=new Date(d.getFullYear(),0,0)
return Math.floor((d-start)/86400000)
}

function solarDeclination(n){
return 23.45*Math.sin(deg2rad((360/365)*(284+n)))
}

function equationOfTime(n){
let B=deg2rad((360/365)*(n-81))
return 9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B)
}

function hourAngle(lat,dec,angle){
let num=Math.sin(deg2rad(angle))-Math.sin(deg2rad(lat))*Math.sin(deg2rad(dec))
let den=Math.cos(deg2rad(lat))*Math.cos(deg2rad(dec))
return rad2deg(Math.acos(num/den))
}

/* ================= SHALAT ================= */

function calculatePrayerTimes(date){

let n=dayOfYear(date)
let dec=solarDeclination(n)
let eot=equationOfTime(n)
let tz=-date.getTimezoneOffset()/60

let dhuhr=12+(tz*15-lon)/15-eot/60

let fajr=dhuhr-hourAngle(lat,dec,-20)/15
let sunrise=dhuhr-hourAngle(lat,dec,-0.833)/15
let maghrib=dhuhr+hourAngle(lat,dec,-0.833)/15
let isha=dhuhr+hourAngle(lat,dec,-18)/15

let latRad=deg2rad(lat)
let decRad=deg2rad(dec)

let g=Math.abs(latRad-decRad)
let asrAngle=rad2deg(Math.atan(1/(1+Math.tan(g))))
let asr=dhuhr+hourAngle(lat,dec,asrAngle)/15

function format(t){
let h=Math.floor(t)
let m=Math.floor((t-h)*60)
return ("0"+h).slice(-2)+":"+("0"+m).slice(-2)
}

/* syuruq +15 menit */
let sunriseMin=Math.floor(sunrise*60)+15
let srH=Math.floor(sunriseMin/60)
let srM=sunriseMin%60
let sunriseFix=("0"+srH).slice(-2)+":"+("0"+srM).slice(-2)

timesToday={
fajr:format(fajr),
sunrise:sunriseFix,
dhuhr:format(dhuhr),
asr:format(asr),
maghrib:format(maghrib),
isha:format(isha)
}

/* update UI */
for(let id in timesToday){
let el=document.getElementById(id)
if(el) el.innerText=timesToday[id]
}

/* mode masjid */
if(document.getElementById("mfajr")){
document.getElementById("mfajr").innerText=timesToday.fajr
document.getElementById("msunrise").innerText=timesToday.sunrise
document.getElementById("mdhuhr").innerText=timesToday.dhuhr
document.getElementById("masr").innerText=timesToday.asr
document.getElementById("mmaghrib").innerText=timesToday.maghrib
document.getElementById("misha").innerText=timesToday.isha
}

highlightPrayer()
}

/* ================= HIGHLIGHT ================= */

function highlightPrayer(){

let now=new Date()
let current=now.getHours()*60+now.getMinutes()

let order=["fajr","sunrise","dhuhr","asr","maghrib","isha"]

document.querySelectorAll("#prayTable td")
.forEach(td=>td.classList.remove("activePrayer"))

for(let i=0;i<order.length;i++){

let id=order[i]
let next=order[i+1]

if(!timesToday[id]) continue

let t=timesToday[id].split(":")
let start=parseInt(t[0])*60+parseInt(t[1])

let end=1440
if(next && timesToday[next]){
let nt=timesToday[next].split(":")
end=parseInt(nt[0])*60+parseInt(nt[1])
}

if(current>=start && current<end){
let cell=document.getElementById(id)
if(cell) cell.classList.add("activePrayer")
break
}
}
}

/* ================= CLOCK ================= */

setInterval(()=>{
let now=new Date()
let h=now.getHours().toString().padStart(2,"0")
let m=now.getMinutes().toString().padStart(2,"0")
let s=now.getSeconds().toString().padStart(2,"0")

let el=document.getElementById("masjidClock")
if(el) el.innerText=h+":"+m+":"+s

},1000)

/* ================= KIBLAT ================= */

function calculateQibla(){

const KAABA_LAT=21.4225
const KAABA_LON=39.8262

let dLon=deg2rad(KAABA_LON-lon)

let y=Math.sin(dLon)*Math.cos(deg2rad(KAABA_LAT))
let x=Math.cos(deg2rad(lat))*Math.sin(deg2rad(KAABA_LAT))-
Math.sin(deg2rad(lat))*Math.cos(deg2rad(KAABA_LAT))*Math.cos(dLon)

qiblaDirection=(rad2deg(Math.atan2(y,x))+360)%360

let el=document.getElementById("qiblaAngle")
if(el) el.innerText="Arah Kiblat "+qiblaDirection.toFixed(1)+"°"
}

/* ================= COMPASS ================= */

function startCompass(){

if(compassStarted) return
compassStarted=true

window.addEventListener("deviceorientation",function(event){

let rawHeading

if(event.webkitCompassHeading){
rawHeading=event.webkitCompassHeading
}else if(event.alpha!==null){
rawHeading=360-event.alpha
}else return

heading=(rawHeading+compassOffset+360)%360

let el=document.getElementById("headingText")
if(el) el.innerText="Arah Kompas "+heading.toFixed(1)+"°"

updateCompass()

},true)

}

function updateCompass(){

let needle=document.getElementById("compassNeedle")
if(needle) needle.setAttribute("transform","rotate("+heading+" 100 100)")

let line=document.getElementById("qiblaLine")
if(line) line.setAttribute("transform","rotate("+qiblaDirection+" 100 100)")

if(directionElement){
directionElement.style.transform="rotate("+qiblaDirection+"deg)"
}
}

/* ================= KALIBRASI ================= */

function calibrateCompass(){
compassOffset=(360-heading)%360
alert("Kalibrasi: "+compassOffset.toFixed(1)+"°")
}

/* ================= HIJRI ================= */

function hijri(date){
return new Intl.DateTimeFormat('id-TN-u-ca-islamic',{
day:'numeric',month:'long',year:'numeric'
}).format(date)
}

/* ================= BULANAN ================= */

function openMonthly(){

if (!checkLocation()) return

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

for(let d=1;d<=days;d++){

let date=new Date(year,month,d)
calculatePrayerTimes(date)

let tr=document.createElement("tr")
let hari=date.toLocaleDateString("id-ID",{weekday:"long"})

tr.innerHTML=`
<td>${hari}</td>
<td>${date.getDate()}-${month+1}-${year}</td>
<td>${hijri(date)}</td>
<td>${timesToday.fajr}</td>
<td>${timesToday.sunrise}</td>
<td>${timesToday.dhuhr}</td>
<td>${timesToday.asr}</td>
<td>${timesToday.maghrib}</td>
<td>${timesToday.isha}</td>
`

if(d===today){
tr.classList.add("highlightToday")
}

tbody.appendChild(tr)
}
}
