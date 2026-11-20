# medmaxx-web

MedMaxx waitlist, served with GitHub Pages at https://medmaxx.in.

- `waitlist-app/`: the Next.js app (static export). A countdown, a form that writes to the Supabase `waitlist` table, and two hands drawn as dots from a 3D model. `/privacy` is the privacy page.
- `.github/workflows/pages.yml`: builds `waitlist-app` and deploys it to GitHub Pages on every push to `main`.
- `index.html`: the earlier single-file waitlist page. It is no longer what the site serves.
- `CNAME`: custom domain, copied into the build.

Develop locally:

```bash
cd waitlist-app
npm install
npm run dev
```

The launch date is `LAUNCH_AT` in `waitlist-app/lib/config.ts`.
