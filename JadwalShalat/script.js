let lat=0
let lon=0

let timesToday={}

let map=new maplibregl.Map({
container:"map",
style:{
version:8,
sources:{
esri:{
type:"raster",
tiles:[
"https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
],
tileSize:256
}
},
layers:[{id:"esri",type:"raster",source:"esri"}]
},
center:[110,-2],
zoom:5
})

let marker=null
let selectedPoint=null

map.on("click",e=>{
selectedPoint=e.lngLat
if(marker) marker.remove()
marker=new maplibregl.Marker().setLngLat(e.lngLat).addTo(map)
})

function getGPS(){
navigator.geolocation.getCurrentPosition(pos=>{
setLocation(pos.coords.latitude,pos.coords.longitude)
})
}

function useMapPoint(){
if(!selectedPoint) return
setLocation(selectedPoint.lat,selectedPoint.lng)
}

function setLocation(a,b){

lat=a
lon=b

map.flyTo({center:[lon,lat],zoom:14})

document.getElementById("locationText").innerText=
"Lokasi: "+lat.toFixed(5)+","+lon.toFixed(5)

calculatePrayerTimes(new Date())

startCompass()
updateCompass()

}

/* MATEMATIKA */

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

function calculatePrayerTimes(date){

let n=dayOfYear(date)
let dec=solarDeclination(n)
let eot=equationOfTime(n)
let tz=-date.getTimezoneOffset()/60

let dhuhr=12+(tz*15-lon)/15-eot/60

let fajr=dhuhr-hourAngle(lat,dec,-18)/15
let sunrise=dhuhr-hourAngle(lat,dec,-0.833)/15
let maghrib=dhuhr+hourAngle(lat,dec,-0.833)/15
let isha=dhuhr+hourAngle(lat,dec,-17)/15
let asr=dhuhr+hourAngle(lat,dec,-Math.atan(1+Math.tan(Math.abs(deg2rad(lat-dec)))))/15

function format(t){
let h=Math.floor(t)
let m=Math.floor((t-h)*60)
return ("0"+h).slice(-2)+":"+("0"+m).slice(-2)
}

timesToday={
fajr:format(fajr),
sunrise:format(sunrise),
dhuhr:format(dhuhr),
asr:format(asr),
maghrib:format(maghrib),
isha:format(isha)
}

for(let id in timesToday){
if(document.getElementById(id))
document.getElementById(id).innerText=timesToday[id]
}

/* MASJID MODE */

document.getElementById("mfajr").innerText=timesToday.fajr
document.getElementById("msunrise").innerText=timesToday.sunrise
document.getElementById("mdhuhr").innerText=timesToday.dhuhr
document.getElementById("masr").innerText=timesToday.asr
document.getElementById("mmaghrib").innerText=timesToday.maghrib
document.getElementById("misha").innerText=timesToday.isha

highlightPrayer()

}

/* HIGHLIGHT WAKTU AKTIF */

function highlightPrayer(){

let now=new Date()

let current=now.getHours()+":"+now.getMinutes()

let order=["fajr","sunrise","dhuhr","asr","maghrib","isha"]

for(let id of order){

let cell=document.getElementById(id)

if(!cell) continue

if(current>=timesToday[id]){

document.querySelectorAll("#prayTable td").forEach(td=>td.classList.remove("activePrayer"))

cell.classList.add("activePrayer")

}

}

}

/* CLOCK MASJID */

setInterval(()=>{

let now=new Date()

let h=now.getHours().toString().padStart(2,"0")
let m=now.getMinutes().toString().padStart(2,"0")
let s=now.getSeconds().toString().padStart(2,"0")

document.getElementById("masjidClock").innerText=h+":"+m+":"+s

},1000)

function openMasjidMode(){
document.getElementById("masjidMode").style.display="block"
}

function closeMasjidMode(){
document.getElementById("masjidMode").style.display="none"
}

/* KIBLAT */

function calculateQibla(){

const KAABA_LAT=21.4225
const KAABA_LON=39.8262

let dLon=deg2rad(KAABA_LON-lon)

let y=Math.sin(dLon)*Math.cos(deg2rad(KAABA_LAT))

let x=
Math.cos(deg2rad(lat))*Math.sin(deg2rad(KAABA_LAT))-
Math.sin(deg2rad(lat))*Math.cos(deg2rad(KAABA_LAT))*Math.cos(dLon)

let qibla=(rad2deg(Math.atan2(y,x))+360)%360

document.getElementById("qiblaAngle").innerText=
"Arah Kiblat "+qibla.toFixed(1)+"°"

window.addEventListener("deviceorientationabsolute",e=>{

let heading=0

function startCompass(){

if (window.DeviceOrientationEvent){

window.addEventListener("deviceorientation",function(event){

let alpha=event.alpha

if(alpha===null) return

heading = 360 - alpha

document.getElementById("headingText").innerText =
"Arah Kompas " + heading.toFixed(1) + "°"

updateCompass()

},true)

}

}

function updateCompass(){

const KAABA_LAT=21.4225
const KAABA_LON=39.8262

let dLon=deg2rad(KAABA_LON-lon)

let y=Math.sin(dLon)*Math.cos(deg2rad(KAABA_LAT))

let x=
Math.cos(deg2rad(lat))*Math.sin(deg2rad(KAABA_LAT))-
Math.sin(deg2rad(lat))*Math.cos(deg2rad(KAABA_LAT))*Math.cos(dLon)

let qibla=(rad2deg(Math.atan2(y,x))+360)%360

document.getElementById("qiblaAngle").innerText =
"Arah Kiblat " + qibla.toFixed(1) + "°"

let rotate=qibla-heading

document.getElementById("northArrow")
.setAttribute("transform","rotate("+rotate+" 100 100)")

}

})

}
