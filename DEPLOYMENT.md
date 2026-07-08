# 🚀 Deploying Bengal International University

The app is packaged as a **single service**: the Express backend serves both the
REST API (`/api/*`) and the compiled React site (everything else). This keeps the
frontend and API same-origin, so cookie-based auth "just works" with no CORS or
cross-site cookie configuration.

You need two things in production:
1. A **MySQL 8** database (managed).
2. A host that runs the **Docker image** (or a Node process).

---

## Option A — Docker (works anywhere)

```bash
# Build the image (compiles the frontend, bundles the backend)
docker build -t biu-university .

# Run it against your MySQL
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET="$(openssl rand -hex 48)" \
  -e DB_HOST=your-db-host -e DB_USER=... -e DB_PASSWORD=... -e DB_NAME=biu_portal \
  -e DB_SSL=true \
  biu-university
```

Seed the database once (creates tables + demo data):

```bash
docker run --rm -e DB_HOST=... -e DB_USER=... -e DB_PASSWORD=... -e DB_NAME=biu_portal -e DB_SSL=true \
  biu-university npm run init-db
```

Then open `http://your-host:3000`.

---

## Option B — Full local stack with Docker Compose

Spins up MySQL **and** the app together:

```bash
docker compose up --build            # starts db + app
docker compose exec app npm run init-db   # first run only — seeds the DB
# open http://localhost:3000
```

---

## Option C — Render (free tier) + free managed MySQL

Render's free plan has no managed MySQL, so use a free external MySQL such as
**Aiven**, **Railway**, or **PlanetScale**.

1. **Create a MySQL database** on your chosen provider. Note host, port, user,
   password, and database name. Enable SSL.
2. **Push this repo to GitHub.**
3. In Render: **New → Blueprint** and select the repo. It reads `render.yaml`.
4. Fill in the `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` values when prompted
   (`JWT_SECRET` is generated automatically).
5. After the first deploy, open the service **Shell** and run:
   ```bash
   npm run init-db
   ```
6. Visit your `*.onrender.com` URL. 🎉

> Because everything is same-origin, keep `COOKIE_SAMESITE=lax`. Render serves over
> HTTPS, so `COOKIE_SECURE=true` is set for you in `render.yaml`.

---

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | prod | Set to `production`. |
| `JWT_SECRET` | **yes** | Long random string. App refuses to boot in prod without it. |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | yes | MySQL connection. |
| `DB_SSL` | cloud | `true` for managed databases that require TLS. |
| `PORT` | no | Defaults to `3000`. Most hosts inject this. |
| `COOKIE_SAMESITE` | no | `lax` (same-origin, default) or `none` (cross-site). |
| `COOKIE_SECURE` | no | `true` on HTTPS. Auto-enabled in production. |
| `CORS_ORIGINS` | cross-site only | Comma-separated allowed origins. Not needed for the single-service deploy. |

---

## Splitting frontend and backend (advanced)

If you'd rather host the frontend on Vercel/Netlify and the backend separately:

- Frontend: set `VITE_API_URL=https://your-api-domain/api` at build time.
- Backend: set `CORS_ORIGINS=https://your-frontend-domain`,
  `COOKIE_SAMESITE=none`, and `COOKIE_SECURE=true` (required for cross-site cookies).

---

## Post-deploy checklist

- [ ] `GET /api/health` returns `{ "status": "ok", "db": "up" }`
- [ ] You seeded the database (`npm run init-db`)
- [ ] You logged in as `admin@biu.edu.bd` and **changed the admin password**
- [ ] `JWT_SECRET` is a strong, unique value not shared with any other environment
