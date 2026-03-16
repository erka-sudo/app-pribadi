import proj4 from "proj4";

export default function handler(req, res) {

let lat = parseFloat(req.query.lat);
let lon = parseFloat(req.query.lon);
let to = req.query.to || "tm3";

if(isNaN(lat) || isNaN(lon)){
return res.status(400).json({error:"invalid coordinate"});
}

// =====================
// GEO → TM3
// =====================

if(to==="tm3"){

let zone = Math.floor((lon - 96) / 3) + 46;

let cm = zone * 3 - 40.5;

let proj = "+proj=tmerc +lat_0=0 +lon_0="+cm+
" +k=0.9999 +x_0=200000 +y_0=1500000 +datum=WGS84 +units=m +no_defs";

let p = proj4("EPSG:4326",proj,[lon,lat]);

let part = lon < cm ? ".1" : ".2";

return res.json({

input:{
lat:lat,
lon:lon
},

tm3:{
east:p[0],
north:p[1],
zone:zone+part
}

});

}

// =====================
// GEO → UTM
// =====================

if(to==="utm"){

let zone = Math.floor((lon+180)/6)+1;

let proj="+proj=utm +zone="+zone+" +datum=WGS84 +units=m +no_defs";

let p=proj4("EPSG:4326",proj,[lon,lat]);

return res.json({

input:{
lat:lat,
lon:lon
},

utm:{
east:p[0],
north:p[1],
zone:zone
}

});

}

res.json({error:"conversion not defined"});

}
