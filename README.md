# 10X CRM V2.0

Customer Relationship Management app built with **Vanilla JavaScript**, **HTML**, and **SCSS**.  
კლიენტებთან ურთიერთობის მართვის აპლიკაცია — **Vanilla JavaScript**, **HTML** და **SCSS**.

Repository: [github.com/nukriotarashvili/10x-crm-v2.0](https://github.com/nukriotarashvili/10x-crm-v2.0)

---

## Tech stack / ტექნოლოგიები

| | |
|---|---|
| **UI** | HTML5, SCSS → CSS, responsive layout |
| **Logic** | ES modules (`type="module"`), no bundler |
| **Data** | Supabase (`clients`) + `localStorage` (users, session, theme) |
| **Fallback** | [DummyJSON](https://dummyjson.com) if Supabase anon key is missing |
| **3D** | [Spline Viewer](https://spline.design) on login/signup & dashboard hero |

---

## Features / ფუნქციონალი

**Authentication** — Sign up, login, validation, auth guard on routes.  
**ავტორიზაცია** — რეგისტრაცია, ლოგინი, ვალიდაცია, მარშრუტების დაცვა.

**Dashboard** — Gradient hero, live clock, stats (clients, revenue, pipeline, recent list).  
**Dashboard** — Hero ბანერი, ცოცხალი საათი, სტატისტიკა.

**Clients** — Load from API/cache, search, filter by status, sort, add/delete (with skeleton loading).  
**კლიენტები** — ჩატვირთვა, ძებნა, ფილტრი, სორტირება, CRUD, skeleton loader.

**Profile** — Edit name/company, change password, reset client data.  
**პროფილი** — მონაცემების განახლება, პაროლი, მონაცემების განულება.

**Theme** — Light / dark mode (`crm_theme` in localStorage).  
**თემა** — ღია / მუქი რეჟიმი.

---

## Project structure / ფაილური სტრუქტურა

```
10x-crm-V2.0/
├── index.html, signup.html          # Auth (Spline split layout)
├── dashboard.html, clients.html, profile.html
├── js/
│   ├── app.js                       # Entry: auth, theme, page router
│   ├── api/
│   │   └── supabase.js              # API + localStorage layer
│   ├── services/
│   │   ├── auth.js
│   │   ├── clients.js
│   │   ├── dashboard.js
│   │   └── profile.js
│   └── utils/
│       ├── dom.js                   # Toast, errors, skeleton
│       └── validation.js
└── styles/                          # SCSS partials → main.css
```

---

## Getting started / გაშვება

ES modules require a **local HTTP server** (do not open HTML via `file://`).

```bash
cd 10x-crm-V2.0
npx serve .
```

Open [http://localhost:3000](http://localhost:3000) → register on **Sign up**, then use the app.

**Compile SCSS** (after style changes):

```bash
sass styles/main.scss styles/main.css
```

---

## Supabase setup / ბაზის დაკავშირება

Project URL: `https://ygizkwgkbutczbctislm.supabase.co`

1. **SQL** — Supabase Dashboard → SQL Editor → run `supabase/migrations/20260724120000_create_clients.sql`
2. **API key** — Settings → API → copy **anon public** key into `js/config.js`:

```javascript
export const SUPABASE_URL = 'https://ygizkwgkbutczbctislm.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

3. Copy `js/config.example.js` if `js/config.js` is missing (`config.js` is gitignored).

Without a valid anon key, the app falls back to DummyJSON + localStorage for clients.

**Security:** Dev RLS policy on `clients` is open for `anon` — replace with Supabase Auth + strict policies before production.

---

## Environment / გარემო

Do not commit `js/config.js` or `.env.local` with real keys. See `.env.local.example` for reference.

---

## LocalStorage keys

| Key | Purpose |
|-----|---------|
| `crm_users` | Registered users |
| `crm_session` | Active session |
| `crm_clients` | Client list cache |
| `crm_theme` | `light` \| `dark` |

---

## License

MIT — see [LICENSE](LICENSE).
