# ✏️ ContractorQuote Pro — PWA

Professional job quoting app for contractors (Sanding, Installing, Painting).

---

## 🚀 Deploy in 5 Minutes (No coding needed!)

### Option A: Deploy via Vercel (Recommended — Free)

1. **Create accounts** (free):
   - [GitHub](https://github.com) — Create a new account if you don't have one
   - [Vercel](https://vercel.com) — Sign up with your GitHub account

2. **Upload to GitHub**:
   - Go to https://github.com/new
   - Name it `contractor-quote-pro`
   - Click **"uploading an existing file"**
   - Drag and drop ALL files from this project folder
   - Click **"Commit changes"**

3. **Deploy on Vercel**:
   - Go to https://vercel.com/new
   - Click **"Import"** next to your `contractor-quote-pro` repo
   - Framework Preset: **Vite**
   - Click **"Deploy"**
   - Wait 1-2 minutes ✅

4. **Done!** Vercel gives you a URL like `contractor-quote-pro.vercel.app`

---

### Option B: Deploy via Netlify (Also Free)

1. Go to https://app.netlify.com/drop
2. Drag the entire project folder onto the page
3. Done! You get a URL instantly.

---

## 📱 How Customers Install the PWA

Once deployed, users can "install" the app on their phone:

**iPhone (Safari):**
1. Open your site URL in Safari
2. Tap the Share button (⬆️)
3. Tap "Add to Home Screen"
4. Tap "Add"

**Android (Chrome):**
1. Open your site URL in Chrome
2. Tap the menu (⋮)
3. Tap "Install app" or "Add to Home Screen"
4. Tap "Install"

The app will appear on their home screen with the CQ Pro icon, and works offline!

---

## 🛠️ Local Development (Optional)

If you want to make changes locally:

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

To build for production:
```bash
npm run build
```

The `dist/` folder is your deployable output.

---

## 📁 Project Structure

```
contractor-quote-pro/
├── public/
│   ├── manifest.json    ← PWA config
│   ├── sw.js            ← Service worker (offline support)
│   ├── icon.svg         ← Browser favicon
│   ├── icon-192.png     ← App icon (small)
│   └── icon-512.png     ← App icon (large)
├── src/
│   ├── main.jsx         ← Entry point + SW registration
│   └── App.jsx          ← Main application code
├── index.html           ← HTML shell with PWA meta tags
├── package.json         ← Dependencies
├── vite.config.js       ← Build config
└── README.md            ← This file
```

---

## 🌐 Custom Domain (Optional)

Want `www.yourcompany.com` instead of `yourapp.vercel.app`?

1. Buy a domain on [Namecheap](https://namecheap.com) (~$10/year)
2. In Vercel → Project Settings → Domains → Add your domain
3. Update DNS as instructed by Vercel
4. Free HTTPS included automatically!
