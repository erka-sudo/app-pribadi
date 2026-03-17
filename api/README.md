# 📍 Coordinate Converter API (UTM ↔ TM3 ↔ Geodetic)

API ini digunakan untuk konversi koordinat:

* Geodetic (Lat, Lon)
* UTM
* TM3 (Indonesia 3° zone)

Mendukung:

* ✅ Single point
* ✅ Batch (ribuan titik)
* ✅ Auto zone detection
* ✅ Validasi koordinat

---

# 🚀 BASE URL

```
https://app-drone-rho.vercel.app/api
```

---

# 📌 ENDPOINTS

## 1️⃣ Single Point

```
POST /api/convert
```

### 🔹 Request

```json
{
  "a": -2.07,
  "b": 102.77,
  "from": "geo",
  "to": "utm"
}
```

### 🔹 Response

```json
{
  "x": 251954.78,
  "y": 9771027.38,
  "zone": 48
}
```

---

## 2️⃣ Batch Conversion (RECOMMENDED)

```
POST /api/convert-batch
```

### 🔹 Request

```json
{
  "from": "geo",
  "to": "utm",
  "points": [
    {"a": -2.07, "b": 102.77},
    {"a": -2.08, "b": 102.78}
  ]
}
```

### 🔹 Response

```json
{
  "total": 2,
  "chunks": 1,
  "results": [
    {"x": 251954.78, "y": 9771027.38, "zone": 48},
    {"x": 252100.12, "y": 9770900.55, "zone": 48}
  ]
}
```

---

# 🔁 FORMAT PARAMETER

| Parameter | Keterangan                           |
| --------- | ------------------------------------ |
| a         | latitude / easting                   |
| b         | longitude / northing                 |
| from      | geo / utm / tm3                      |
| to        | geo / utm / tm3                      |
| zone      | opsional (wajib untuk UTM/TM3 input) |

---

# 🧠 LOGIKA ZONA

## UTM

* Auto detect dari longitude jika dari GEO
* Jika input UTM → wajib isi zone

Contoh:

```
48
```

---

## TM3 (Indonesia)

Format:

```
48.1 atau 48.2
```

### Central Meridian:

| Zona | CM    |
| ---- | ----- |
| 48.1 | 103.5 |
| 48.2 | 106.5 |
| 49.1 | 106.5 |
| 49.2 | 109.5 |

---

# ⚙️ FITUR UTAMA

## ✅ Auto Chunk (Batch)

* Maks 1000 titik per chunk
* Aman untuk 10.000+ titik

## ✅ Validasi Otomatis

* Lat/Lon range
* UTM range
* TM3 range

## ✅ Fallback Aman

* Jika API gagal → frontend tetap bisa proses

---

# 📊 BATASAN

| Item       | Limit             |
| ---------- | ----------------- |
| Batch size | ±5000 aman        |
| Timeout    | tergantung Vercel |
| Format     | JSON only         |

---

# 🧪 TEST VIA BROWSER

Buka DevTools → Console:

```javascript
fetch("https://app-drone-rho.vercel.app/api/convert",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
a:-2.07,
b:102.77,
from:"geo",
to:"utm"
})
})
.then(r=>r.json())
.then(console.log)
```

---

# 📦 CONTOH BATCH BESAR

```javascript
fetch("https://app-drone-rho.vercel.app/api/convert-batch",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
from:"geo",
to:"utm",
points:Array.from({length:1000},(_,i)=>({
a:-2.07 + i*0.0001,
b:102.77 + i*0.0001
}))
})
})
.then(r=>r.json())
.then(console.log)
```

---

# 🔥 USE CASE

* Drone photogrammetry QC
* GIS processing
* Survey data conversion
* CSV batch processing
* Mapping pipeline

---

# 🛠️ TEKNOLOGI

* proj4js
* Vercel Serverless Functions
* JavaScript (Node.js)

---

# ⚠️ CATATAN PENTING

* TM3 wajib pakai `.1` atau `.2`
* UTM wajib zone jika input bukan GEO
* Semua koordinat menggunakan WGS84

---

# 👨‍💻 AUTHOR

Developed for Drone QC & Survey workflow.

---

# 🚀 NEXT DEVELOPMENT

* Map visualization (QC)
* GeoJSON export
* API Key security
* Upload CSV langsung ke API
* Realtime validation

---
