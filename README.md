# DB Proxy — PostgreSQL Read-Only REST API

Proxy untuk mengakses database PostgreSQL (IPOS 5) secara read-only via REST API. Database ada di `localhost:5444`, server ini di port `3002`.

---

## Base URL

| Lingkungan | URL |
|---|---|
| Lokal | `http://localhost:3002` |
| Tailscale Funnel | `https://<your-tailnet>.ts.net` |

---

## Endpoint

### 1. Health Check

Cek apakah server hidup.

```
GET /health
```

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-06-21T04:19:35.034Z"
}
```

---

### 2. Query Database (read-only)

```
POST /api/query
Headers:
  Content-Type: application/json
  X-API-Key: <your-api-key>

Body (JSON):
{
  "sql": "SELECT column1, column2 FROM table_name WHERE condition = $1",
  "params": ["value1"]
}
```

#### Response 200 — Sukses
```json
{
  "success": true,
  "rows": [
    { "kode": "M014 - M0263", "nama": "RUKMINI" }
  ],
  "rowCount": 1,
  "duration": "12ms"
}
```

Jika hasil melebihi 1000 baris atau tidak pakai `LIMIT`, ada field tambahan:
```json
{
  "success": true,
  "rows": [ ... ],
  "rowCount": 1000,
  "duration": "45ms",
  "truncated": true
}
```

#### Response 400 — Bad Request (validasi gagal)
```json
{
  "success": false,
  "error": "sql must be a non-empty string"
}
```

#### Response 401 — Unauthorized (API key salah/tidak ada)
```json
{
  "success": false,
  "error": "Unauthorized: invalid or missing API key"
}
```

#### Response 403 — Forbidden (query bukan SELECT)
```json
{
  "success": false,
  "error": "Read only: SELECT queries only"
}
```

#### Response 408 — Timeout (query > 30 detik)
```json
{
  "success": false,
  "error": "Request timeout"
}
```

#### Response 429 — Rate Limit (terlalu banyak request)
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

#### Response 500 — Internal Error (error database dll)
```json
{
  "success": false,
  "error": "<pesan error dari database>"
}
```

---

## Contoh Request (curl)

### Query sukses (SELECT)
```bash
curl -X POST "http://localhost:3002/api/query" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: key_untuk_dashboard" \
  -d "{\"sql\":\"SELECT kode, nama FROM tbl_supel LIMIT 3\",\"params\":[]}"
```

### Query dengan parameter ($1, $2, ...)
```bash
curl -X POST "http://localhost:3002/api/query" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: key_untuk_dashboard" \
  -d "{\"sql\":\"SELECT * FROM tbl_accjurnal WHERE modul = \$1 AND tanggal >= CURRENT_DATE - \$2\",\"params\":[\"KAS\",7]}"
```

### Tanpa API Key → 401
```bash
curl -X POST "http://localhost:3002/api/query" \
  -H "Content-Type: application/json" \
  -d "{\"sql\":\"SELECT 1\",\"params\":[]}"
```

### Query non-SELECT → 403
```bash
curl -X POST "http://localhost:3002/api/query" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: key_untuk_dashboard" \
  -d "{\"sql\":\"DROP TABLE tbl_accjurnal\",\"params\":[]}"
```

---

## Contoh Integrasi (JavaScript/TypeScript)

### Fetch API (browser/Node.js)
```js
const res = await fetch("http://localhost:3002/api/query", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "key_untuk_dashboard"
  },
  body: JSON.stringify({
    sql: "SELECT kode, nama FROM tbl_supel WHERE kode = $1",
    params: ["M014 - M0263"]
  })
});
const data = await res.json();
console.log(data.rows);
```

### Axios
```js
const res = await axios.post("http://localhost:3002/api/query", {
  sql: "SELECT kode, nama FROM tbl_supel WHERE kode = $1",
  params: ["M014 - M0263"]
}, {
  headers: { "X-API-Key": "key_untuk_dashboard" }
});
console.log(res.data.rows);
```

---

## Aturan Keamanan (WAJIB dipatuhi oleh client)

1. **API Key** — Kirim key di header `X-API-Key`. Key bisa berbeda per aplikasi.
2. **SELECT only** — Query harus SELECT. INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, EXECUTE, CALL, MERGE, REPLACE, atau INTO — semuanya ditolak.
3. **Parameterized query** — Gunakan placeholder `$1, $2, ...` jangan string interpolation.
4. **SQL maksimal** 1000 karakter.
5. **Params maksimal** 20 parameter.
6. **Rate limit** 60 request per menit per IP.
7. **Query timeout** 30 detik — kalau lebih, timeout.
8. **Result limit** 1000 baris — otomatis dikasih `LIMIT 1000` jika tidak ada LIMIT.

---

## Cara Install & Jalankan

### 1. Clone / masuk folder
```bash
cd db-proxy
```

### 2. Install dependencies
```bash
npm install
```

### 3. Buat file .env
```bash
copy .env.example .env
```
Edit `.env` — isi password database dan API key yang diinginkan.

### 4. Jalankan
```bash
npm start
```
Server akan berjalan di `http://localhost:3002`.

### Production dengan PM2 (auto-start saat Windows restart)
```bash
npm install -g pm2
pm2 start src/index.js --name db-proxy
pm2 save
pm2 startup
```

### Expose ke internet via Tailscale Funnel
```bash
tailscale funnel --bg 3002
```
Setelah itu bisa diakses dari URL: `https://<nama-server>.ts.net/api/query`

---

## Env Variables (.env)

| Variable | Wajib | Default | Deskripsi |
|---|---|---|---|
| `PORT` | Tidak | `3002` | Port server |
| `NODE_ENV` | Tidak | `production` | Environment |
| `DB_HOST` | Ya | `localhost` | Host PostgreSQL |
| `DB_PORT` | Ya | `5444` | Port PostgreSQL |
| `DB_NAME` | Ya | `i5_2026` | Nama database |
| `DB_USER` | Ya | `sysi5adm` | User PostgreSQL |
| `DB_PASSWORD` | Ya | — | Password PostgreSQL |
| `API_KEYS` | Ya | — | Daftar API key, pisahkan koma (contoh: `key1,key2`) |
| `CORS_ORIGINS` | Tidak | `*` | Domain yang diizinkan, pisahkan koma (contoh: `https://app.vercel.app`) |
| `RATE_LIMIT_PER_MINUTE` | Tidak | `60` | Maksimal request per menit per IP |
| `LOG_FILE` | Tidak | `server.log` | File log |
| `LOG_LEVEL` | Tidak | `info` | Level log |

---

## Struktur Project

```
db-proxy/
├── package.json
├── .env                # (jangan di-commit)
├── .env.example        # template tanpa nilai rahasia
├── .gitignore
├── server.log          # (auto-generated)
├── README.md
└── src/
    ├── index.js        # entry point Express
    ├── config.js       # baca .env
    ├── db.js           # koneksi PostgreSQL pool
    ├── middleware/
    │   ├── auth.js     # validasi API Key
    │   ├── rateLimit.js
    │   ├── cors.js
    │   └── validate.js
    ├── routes/
    │   └── query.js    # POST /api/query
    └── utils/
        ├── logger.js
        └── sanitize.js # filter SELECT only + inject LIMIT
```
