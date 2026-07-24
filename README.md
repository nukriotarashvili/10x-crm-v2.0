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
| **Data** | `localStorage` (users, session, clients) + [DummyJSON](https://dummyjson.com) API |
| **3D** | [Spline Viewer](https://spline.design) on login/signup & dashboard hero |
| **Future** | `js/api/supabase.js` structured for Supabase REST migration |

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

## Environment / გარემო

Optional `.env.local` may hold future Supabase keys. **Do not commit** secrets — keep `.env.local` out of git.

Vanilla static app does not load `.env` at runtime yet; configure Supabase in `js/api/supabase.js` when you migrate off DummyJSON.

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
