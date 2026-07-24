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
| **Data** | Supabase Auth (`profiles`) + `clients` table + `localStorage` (theme only) |

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
├── index.html, signup.html          # Auth (full-page gradient, centered form)
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

Styles: HTML loads **`styles/main.css`**, compiled from **`styles/main.scss`** (partials: `_variables`, `_animations`, `_global`, `_auth`, `_layout`).

```bash
cd 10x-crm-V2.0
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) → register on **Sign up**, then use the app.

**SCSS only** (after style changes):

```bash
npm run build:css
# or live reload while editing SCSS:
npm run watch:css
```

---

## Supabase setup / ბაზის დაკავშირება

Project URL: `https://ygizkwgkbutczbctislm.supabase.co`

1. **SQL** — Supabase Dashboard → SQL Editor → run, in order:
   - `supabase/migrations/20260724120000_create_clients.sql`
   - `supabase/migrations/20260724130000_create_profiles.sql`
2. **Auth** — Dashboard → Authentication → Providers: enable **Email**. For local dev, you can disable “Confirm email”.
3. **API key** — Settings → API → copy **anon public** key into `js/config.js`:

```javascript
export const SUPABASE_URL = 'https://ygizkwgkbutczbctislm.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

3. Copy `js/config.example.js` if `js/config.js` is missing (`config.js` is gitignored).

Without a valid anon key in `js/config.js`, login and registration will not work.

**Security:** Dev RLS on `clients` is open for `anon` — tighten policies for production.

---

## Environment / გარემო

Do not commit `js/config.js` or `.env.local` with real keys. See `.env.local.example` for reference.

---

## LocalStorage keys

| Key | Purpose |
|-----|---------|
| `crm_theme` | `light` \| `dark` |

Auth session is stored by **Supabase Auth** in the browser (not `crm_users` / `crm_session`).

---

## License

MIT — see [LICENSE](LICENSE).
