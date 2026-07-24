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

**Clients** — Paginated load, debounced search, List/Kanban (HTML5 drag & drop), CSV export, filter, sort, CRUD, skeleton loader.  
**კლიენტები** — Load More, debounce ძებნა, Kanban, CSV ექსპორტი, CRUD.

**Kanban board** — Switch List/Kanban on Clients; drag cards across Lead → Contacted → Won → Lost; optimistic UI + Supabase status sync.  
**Kanban** — სტატუსის გადათრევა, UI + ბაზის განახლება.

**Search debounce** — 300ms delay before client-side filter runs.  
**Debounce** — ძებნა 300ms შემდეგ.

**Pagination** — `Load More` fetches next Supabase page and appends cards.  
**პაგინაცია** — Load More + Supabase range.

**CSV export** — Download current filtered `clientsState` as `.csv` via Blob URL.  
**CSV** — ფილტრირებული კლიენტების ჩამოტვირთვა.

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
│   ├── pages/
│   │   └── clients-page.js          # Kanban, load more, CSV export UI
│   └── utils/
│       ├── dom.js                   # Toast, errors, skeleton, debounce
│       ├── csv.js                   # CSV string + Blob download
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

**Invalid API key at signup:** The static app reads **`js/config.js` only** (not `.env.local`). Fix: Supabase Dashboard → **Settings → API** → copy **Project URL** and **anon public** from the **same** page into `js/config.js`, or run `npm run config:sync` after filling `.env.local`. Hard-refresh the browser (`Ctrl+Shift+R`).

**User / profile not saved:** Run `supabase/migrations/20260724130000_create_profiles.sql` in SQL Editor (includes `profiles_insert_own` policy + auth trigger). For local dev, disable **Confirm email** under Authentication → Providers → Email so signup returns a session.

**HTTP 429 on signup/login:** Supabase Auth rate limit (often after many test signups from the same IP). Wait 1–2 minutes; do not spam the button. Free tier limits are stricter.

**HTTP 400 on login (`/auth/v1/token?grant_type=password`):** Usually wrong email/password, or **email not confirmed** when «Confirm email» is enabled in Supabase. For local dev, disable confirm under Authentication → Providers → Email, or confirm via the email link. Check Authentication → Users in the Dashboard.

**`net::ERR_NAME_NOT_RESOLVED`:** The Project URL hostname is wrong (typo or deleted project). Valid project for this repo: `https://ygizkwgkbutczbctislm.supabase.co` — do not use `ygkz...` (that host does not exist in DNS).

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
