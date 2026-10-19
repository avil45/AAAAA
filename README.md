# सनातन धर्म संस्था, बस्ती — श्री रामलीला महोत्सव 2026

Jai Shri Ram 🙏 — static, mobile-first website (no build step, deploys straight to GitHub Pages).

## Structure

```
index.html        मुखपृष्ठ (home)
mahotsav.html     रामलीला महोत्सव (details + full day-wise schedule)
live.html         लाइव एवं लीला (live stream, premiere, archive)
sahyog.html       सहयोग करें (bank / UPI / contacts)
404.html          not-found page
assets/
  css/main.css    the whole design system (tokens, components, pages)
  js/data.js      ★ ALL editable content: dates, schedule, live settings
  js/app.js       shared UI (menu, countdown, schedule, share, calendar, copy…)
  js/live.js      live-page logic (state machine, premiere, tabs, archive)
  img/  icons/    images, logo, QR, favicons
manifest.webmanifest · sitemap.xml · robots.txt · .github/workflows/static.yml
```

## Everyday edits

* **Schedule / schools / dates / live channel / premiere video** → only `assets/js/data.js`.
  Every page reads from it, so there is nothing to keep in sync.
* **Go-live test** → set `forceLive: true` in `data.js` (set back to `false` afterwards).
* **Phone, e-mail, bank or UPI details** → search for the value and replace it in the four `.html` files
  (header/footer/dock are repeated on each page).
* **Colours / fonts** → CSS variables at the top of `assets/css/main.css`.
