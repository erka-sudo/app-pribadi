import proj4 from "proj4";

// =====================
// UTM
// =====================
function buildUTMproj(zone, lat){
let south = lat < 0 ? " +south" : "";
return "+proj=utm +zone="+zone+south+" +datum=WGS84 +units=m +no_defs";
}

function autoUTMzone(lon){
return Math.floor((lon + 180)/6) + 1;
}

// =====================
// TM3
// =====================
function parseTM3zone(z){
let p=z.split(".");
let base=parseInt(p[0]);
let cmUTM=base*6-183;

if(p[1]==="1") return cmUTM-1.5;
if(p[1]==="2") return cmUTM+1.5;

return null;
}

function getTM3zone(lon){
let z=autoUTMzone(lon);
let cm=z*6-183;
return lon<cm?z+".1":z+".2";
}

function buildTM3proj(cm){
return "+proj=tmerc +lat_0=0 +lon_0="+cm+
" +k=0.9999 +x_0=200000 +y_0=1500000 +datum=WGS84 +units=m +no_defs";
}

// =====================
// CORE
// =====================
function convertPoint(a,b,from,to,zone){

// GEO → UTM
if(from==="geo" && to==="utm"){
let z=autoUTMzone(b);
let p=proj4("EPSG:4326",buildUTMproj(z,a),[b,a]);
return {x:p[0], y:p[1], zone:z};
}

// UTM → GEO
if(from==="utm" && to==="geo"){
let p=proj4(buildUTMproj(zone,-1),"EPSG:4326",[a,b]);
return {lat:p[1], lon:p[0]};
}

// GEO → TM3
if(from==="geo" && to==="tm3"){
let z=getTM3zone(b);
let cm=parseTM3zone(z);
let p=proj4("EPSG:4326",buildTM3proj(cm),[b,a]);
return {x:p[0], y:p[1], zone:z};
}

// TM3 → GEO
if(from==="tm3" && to==="geo"){
let cm=parseTM3zone(zone);
let p=proj4(buildTM3proj(cm),"EPSG:4326",[a,b]);
return {lat:p[1], lon:p[0]};
}

// TM3 → UTM
if(from==="tm3" && to==="utm"){
let cm=parseTM3zone(zone);
let geo=proj4(buildTM3proj(cm),"EPSG:4326",[a,b]);

let utmZ=autoUTMzone(geo[0]);
let p=proj4("EPSG:4326",buildUTMproj(utmZ,geo[1]),[geo[0],geo[1]]);

return {x:p[0], y:p[1], zone:utmZ};
}

// UTM → TM3
if(from==="utm" && to==="tm3"){
let geo=proj4(buildUTMproj(zone,-1),"EPSG:4326",[a,b]);

let tm3z=getTM3zone(geo[0]);
let cm=parseTM3zone(tm3z);

let p=proj4("EPSG:4326",buildTM3proj(cm),[geo[0],geo[1]]);

return {x:p[0], y:p[1], zone:tm3z};
}

return {error:"conversion not defined"};
}

// =====================
// API HANDLER
// =====================
export default function handler(req,res){

if(req.method!=="POST"){
return res.status(405).json({error:"Use POST"});
}

try{

let {points,from,to,zone} = req.body;

if(!Array.isArray(points)){
return res.status(400).json({error:"points harus array"});
}

let results = points.map(p=>{
let a=p.a;
let b=p.b;

return convertPoint(a,b,from,to,zone);
});

res.status(200).json({
count: results.length,
results: results
});

}catch(e){
res.status(500).json({error:e.message});
}

}
