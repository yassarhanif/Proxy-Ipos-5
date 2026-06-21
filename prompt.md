# Prompt: Proxy PostgreSQL Read-Only API (Express)

Buatkan Express.js server proxy yang berfungsi sebagai jembatan REST API untuk query read-only ke database PostgreSQL IPOS 5. Server berjalan di MESIN YANG SAMA dengan database (`localhost:5444`), diekspos ke internet via Tailscale Funnel.

**Tujuan**: Satu proxy untuk semua aplikasi — dashboard Vercel, app stok, app customer, dll. Cukup dibuat sekali, tidak perlu di-update lagi.

---

## Persyaratan Teknis

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL via `pg` (connection pool)
- **Port**: 3001
- **Platform**: Windows (server IPOS 5)

---

## Endpoint

Hanya satu endpoint:

### `POST /api/query`

**Request**:
```json
{
  "sql": "SELECT kode, nama FROM tbl_supel WHERE kode = $1",
  "params": ["M014 - M0263"]
}
```

**Response sukses**:
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

**Response error**:
```json
{
  "success": false,
  "error": "Read only: SELECT queries only"
}
```

---

## Keamanan (WAJIB)

Semua proteksi berikut HARUS diimplementasikan:

### 1. API Key Authentication

- Header: `X-API-Key: <key>`
- Config via env: `API_KEYS=key1,key2,key3` (multiple keys, satu per aplikasi)
- Response `401 Unauthorized` kalau key salah/tidak ada

### 2. Read-Only Enforcement (KETAT)

Sebelum eksekusi query, validasi:

```js
const sqlTrimmed = sql.trim();
if (!/^\s*SELECT\b/i.test(sqlTrimmed)) {
  return res.status(403).json({ success: false, error: 'Read only: SELECT queries only' });
}
```

Juga tolak jika mengandung kata (case-insensitive):
- `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`
- `TRUNCATE`, `EXECUTE`, `CALL`, `MERGE`, `REPLACE`
- `INTO `, `INTO(` — untuk cegah `SELECT ... INTO`

### 3. Parameterized Query WAJIB

- Parameter wajib pakai placeholder (`$1`, `$2`)
- Dilarang keras string interpolation ke SQL
- Kirim parameter via array `params`

### 4. Rate Limiting

- Pakai `express-rate-limit`
- Default: 60 request/menit per IP
- Config via env: `RATE_LIMIT_PER_MINUTE`

### 5. CORS

- Pakai library `cors`
- Config via env: `CORS_ORIGINS=https://app1.vercel.app,https://app2.vercel.app`
- Bisa asterisk `*` untuk development

### 6. Input Validation

- `sql`: wajib string, maksimal 1000 karakter
- `params`: wajib array, maksimal 20 parameter
- Kalau validasi gagal → `400 Bad Request`

### 7. Query Timeout

- Maksimal 30 detik per query
- Pakai `StatementTimeout` di pool config atau `AbortController`
- Kalau timeout → `408 Request Timeout`

### 8. Result Size Limit

- Maksimal 1000 baris per query
- Kalau user tidak kasih `LIMIT`, inject otomatis `LIMIT 1000`
- Kalau melebihi, return 1000 baris + warning `"truncated": true`

### 9. Logging

- Setiap request dicatat: timestamp, API Key (partial masked), endpoint, query (truncated 100 chars), duration, status code
- Simpan ke file: `server.log`
- Jangan log: full API Key, parameter values
- Pakai `morgan` untuk HTTP logging + custom logger

---

## Database Connection

**Config via env**:
```
DB_HOST=localhost
DB_PORT=5444
DB_NAME=i5_2026
DB_USER=sysi5adm
DB_PASSWORD=u&aV23cc.o82dtr1x89c
```

**Gunakan connection pool** (`pg.Pool`) dengan:
- `max: 10`
- `idleTimeoutMillis: 30000`
- `connectionTimeoutMillis: 5000`
- `statement_timeout: 30000` (30 detik)

---

## Struktur File

```
db-proxy/
├── package.json
├── .env                    # config (jangan di-commit)
├── .env.example            # template tanpa nilai rahasia
├── .gitignore
├── src/
│   ├── index.js            # entry point: init Express + middleware + routes
│   ├── config.js           # baca .env + validasi required vars
│   ├── db.js               # koneksi pool PostgreSQL
│   ├── middleware/
│   │   ├── auth.js         # API Key validator
│   │   ├── rateLimit.js    # rate limiter
│   │   ├── cors.js         # CORS config
│   │   └── validate.js     # input validation
│   ├── routes/
│   │   └── query.js        # POST /api/query
│   └── utils/
│       ├── logger.js       # logging
│       └── sanitize.js     # read-only + SQL enforcement
└── server.log              # auto-generated, di .gitignore
```

---

## Env Variables

```env
PORT=3001
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5444
DB_NAME=i5_2026
DB_USER=sysi5adm
DB_PASSWORD=u&aV23cc.o82dtr1x89c

API_KEYS=key_untuk_dashboard,key_untuk_app_lain
CORS_ORIGINS=https://dashboard-laporan-penjualan-ipos-nibras-house-citeureup.vercel.app
RATE_LIMIT_PER_MINUTE=60

LOG_FILE=server.log
LOG_LEVEL=info
```

---

## Cara Menjalankan

### Install dependencies
```bash
cd db-proxy
npm init -y
npm install express pg cors express-rate-limit dotenv morgan
```

### Development
```bash
node src/index.js
# atau
npx nodemon src/index.js
```

### Production (background service) — Windows
```bash
npm install -g pm2
pm2 start src/index.js --name db-proxy
pm2 save
pm2 startup   # auto-start saat Windows restart
```

### Expose via Tailscale Funnel
```bash
tailscale funnel --bg 3001
```

Setelah itu akses via:
```
https://server-ipos-5-komputer-bawah.tailed4eee.ts.net/api/query
```

---

## Testing

### Query sukses
```bash
curl -X POST \
  -H "X-API-Key: key_untuk_dashboard" \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT kode, nama FROM tbl_supel LIMIT 3","params":[]}' \
  "http://localhost:3001/api/query"
```

### Query tanpa API Key → 401
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT 1","params":[]}' \
  "http://localhost:3001/api/query"
```

### Query non-SELECT → 403
```bash
curl -X POST \
  -H "X-API-Key: key_untuk_dashboard" \
  -H "Content-Type: application/json" \
  -d '{"sql":"DROP TABLE tbl_accjurnal","params":[]}' \
  "http://localhost:3001/api/query"
```

### Dengan parameter
```bash
curl -X POST \
  -H "X-API-Key: key_untuk_dashboard" \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT * FROM tbl_accjurnal WHERE modul = $1 AND tanggal >= CURRENT_DATE - $2","params":["KAS", 7]}' \
  "http://localhost:3001/api/query"
```

---

## Integrasi Dashboard Vercel

Di project Next.js dashboard yang sudah ada (`dashboard-ipos` atau nama lain):

### Opsi A: Ubah API routes jadi proxy

Di `src/app/api/sales/daily/route.ts`:
```ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get('days') || '7';
  
  const proxyUrl = process.env.API_PROXY_URL;
  
  if (proxyUrl) {
    const res = await fetch(`${proxyUrl}/api/sales/daily?days=${days}`, {
      headers: { 'X-API-Key': process.env.API_PROXY_KEY || '' }
    });
    const data = await res.json();
    return NextResponse.json(data);
  }
  
  // Local dev: query DB langsung
  // ... existing logic from db.ts ...
}
```

### Opsi B: Ganti `db.ts` langsung panggil proxy

```ts
import { Pool } from 'pg';

const pool = new Pool({ ... });

const proxyUrl = process.env.API_PROXY_URL;
const proxyKey = process.env.API_PROXY_KEY;

export async function queryProxy(sql: string, params: any[] = []) {
  if (proxyUrl) {
    const res = await fetch(`${proxyUrl}/api/query`, {
      method: 'POST',
      headers: {
        'X-API-Key': proxyKey || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.rows;
  }
  // Local dev: langsung query DB
  const result = await pool.query(sql, params);
  return result.rows;
}
```

**Env variables di Vercel:**
```
API_PROXY_URL=https://server-ipos-5-komputer-bawah.tailed4eee.ts.net
API_PROXY_KEY=key_untuk_dashboard
```

---

## README.md

Buat file `README.md` di root project yang berisi:
- Deskripsi singkat: proxy read-only PostgreSQL via REST API
- Cara install (npm install)
- Cara konfigurasi (copy .env.example ke .env, isi nilai)
- Cara jalanin (node src/index.js / pm2)
- Cara expose via Tailscale Funnel
- Contoh request curl (sukses, error, parameterized)
- Daftar env variables dan penjelasannya
- Catatan keamanan (API Key, read-only, CORS)

---

## Catatan Penting

1. **`.env` jangan di-commit** — tambahkan ke `.gitignore`
2. **Ganti API Keys** jadi string random minimal 32 karakter
3. **Satu key per aplikasi** — kalau bocor, revoke satu key aja
4. **Cek log** (`server.log`) secara berkala untuk aktivitas mencurigakan
5. **Update `CORS_ORIGINS`** kalau ada domain baru