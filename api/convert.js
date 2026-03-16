import proj4 from "proj4";

export default function handler(req,res){

let lat=parseFloat(req.query.lat);
let lon=parseFloat(req.query.lon);

let zone=Math.floor((lon-96)/3)+46;

let cm=zone*3-40.5;

let proj="+proj=tmerc +lat_0=0 +lon_0="+cm+
" +k=0.9999 +x_0=200000 +y_0=1500000 +datum=WGS84 +units=m +no_defs";

let p=proj4("EPSG:4326",proj,[lon,lat]);

res.json({

tm3_e:p[0],
tm3_n:p[1],
zone:zone+".1"

});

}
