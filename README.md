# Finance Project Dashboard — standalone app

This is a standalone export of the finance project dashboard, built so it can
be deployed on your own domain instead of living inside a Claude.ai artifact.
Same UI, same charts, same stakeholder views — the only real change is
**where the data lives**: instead of Claude's artifact storage, it now reads
and writes to a small Supabase table so every visitor sees the same live
dashboard.

Editing is disabled in this build (the "Edit Data" tab is greyed out), so it
ships as a read-only public dashboard by default. See "Re-enabling editing"
below if you want visitors — or just you — to be able to edit it live.

## 1. Set up Supabase (free tier is enough)

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, go to **SQL Editor → New query**, paste the
   contents of `supabase/schema.sql`, and run it. This creates the
   `dashboard_state` table that stores the dashboard's data as a single JSON
   blob, plus row-level-security policies that make it publicly readable.
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key

## 2. Configure the app

```bash
cp .env.example .env
```

Paste your Project URL and anon key into `.env`:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Seed it with data

The app no longer auto-seeds sample data on first load (that was an
artifact-only convenience). Easiest way to get data in:

- Temporarily re-enable the Edit Data tab (see below), fill in your project
  details locally, then disable it again before deploying, **or**
- Insert a starting row directly in Supabase: **Table Editor → dashboard_state
  → Insert row**, with `key` = `finance-dashboard-data-v2` and `value` set to
  a JSON object matching the shape in `src/App.jsx`'s `sampleData()` /
  `emptyData()` functions.

## 4. Run it locally

```bash
npm install
npm run dev
```

Visit the local URL Vite prints (usually `http://localhost:5173`).

## 5. Deploy

This builds to a plain static site (`npm run build` → `dist/`), so it works
on any static host. Two common options:

**Vercel**
```bash
npm i -g vercel
vercel
```
Set the two `VITE_SUPABASE_*` env vars in the Vercel project settings
(Environment Variables) — not just your local `.env`, since that file isn't
deployed.

**Netlify**
- Connect the repo, or drag-and-drop the `dist/` folder after `npm run build`
  in the Netlify dashboard.
- Build command: `npm run build`, publish directory: `dist`.
- Add the same two env vars in **Site settings → Environment variables**.

Either way, once deployed you'll get a public URL. Point your own domain at
it via the host's custom-domain settings if you want `dashboard.yourco.com`
instead of the host's default subdomain.

## Re-enabling editing

In `src/App.jsx`, find the "Edit Data" tab button and remove the `disabled`
attribute:

```jsx
<button
  className={`fpd-tab${tab === "edit" ? " active" : ""}`}
  onClick={() => setTab("edit")}
  // disabled  <-- remove this line
  title="Data entry is currently locked"
>
  Edit Data
</button>
```

If you do this on a **public** deployment, remember the Supabase RLS
policies in `schema.sql` currently allow anyone with the anon key (i.e.
anyone visiting the site) to write to the table too. For a public site with
live editing, you likely want to either add real authentication in front of
the Edit Data tab, or restrict the Supabase write policies to a signed-in
role — see the comments in `supabase/schema.sql`.

## Notes

- Storage writes are debounced ~500ms after you stop typing, so rapid edits
  collapse into a single Supabase write.
- All KPI math (CPI/SPI, RAG thresholds, burn rate) lives in `src/App.jsx`
  and is unchanged from the artifact version — it's a simplified,
  directionally-correct EVM approximation, not a certified PM calculation.
