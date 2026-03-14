# 🛡️ Phishing Guard

A lightweight, **offline** Chrome browser extension that detects and blocks phishing websites in real time using heuristic URL analysis, DOM inspection, and a local domain blacklist — no external API calls required.

---

## 📸 How It Looks

| Popup — Safe | Popup — Suspicious | Popup — Phishing | Warning Page |
|---|---|---|---|
| ✅ Green verdict | 🟠 Orange verdict | 🔴 Red verdict | 🚫 Full block screen |

---

## ✨ Features

- **Real-time phishing detection** on every page you visit
- **Risk scoring system** (0–100) with three verdict levels: Safe, Suspicious, Phishing
- **URL heuristics** — detects suspicious keywords, long URLs, IP-based domains, and homograph attacks
- **Login form analysis** — flags password forms that submit to a different domain
- **Redirect detection** — penalizes pages with excessive HTTP redirects
- **Email-origin detection** — raises alert if you arrived from Gmail or Outlook
- **Local blacklist** — instant match against known phishing domains
- **User whitelist** — permanently trust any domain with one click
- **Blocking warning page** — replaces phishing tabs with a clear red alert screen
- **100% offline** — no data ever leaves your browser

---

## 🏗️ Project Structure

```
phishing-guard/
├── manifest.json          # Extension config (Manifest V3)
├── background.js          # Service worker: scoring engine + tab manager
├── content_script.js      # Injected into every page: collects signals
├── popup.html             # Toolbar button UI layout
├── popup.js               # Popup logic: fetches & displays results
├── warning.html           # Full-page phishing block screen
├── rules/
│   └── blacklist.json     # Known phishing domains list
└── icons/
    └── icon128.png        # Extension icon
```

---

## ⚙️ How It Works

### 1. Signal Collection (`content_script.js`)
Injected into every webpage at `document_end`. Collects 5 phishing signals:

| Signal | What it checks |
|---|---|
| **URL heuristics** | URL length > 75, IP address as hostname, `@` symbol, 3+ hyphens, suspicious keywords (`login`, `verify`, `wallet`, etc.), non-ASCII characters (homograph attacks) |
| **Login form mismatch** | Page has a password field whose `<form action>` points to a different domain |
| **Redirect count** | Number of HTTP redirects before the page loaded |
| **Email referrer** | Whether you arrived from `mail.google.com` or `outlook.live.com` |
| **Blacklist match** | Domain appears in `rules/blacklist.json` |

### 2. Risk Scoring (`background.js`)
The service worker receives signals and calculates a score:

| Condition | Points |
|---|---|
| Suspicious URL | +25 |
| Fake login form (action mismatch) | +30 |
| More than 2 redirects | +15 |
| Arrived from email client | +10 |
| Domain on blacklist | +40 |
| Domain on user whitelist | Score → **0** |
| **Maximum score** | **100** |

### 3. Verdict
| Score Range | Verdict | Action |
|---|---|---|
| 0 – 30 | ✅ Safe | Show green in popup |
| 31 – 60 | 🟠 Suspicious | Show orange in popup |
| 61 – 100 | 🔴 Phishing | Show red + **redirect tab to warning page** |

---

## 🚀 Installation (Developer Mode)

Since this extension is not published on the Chrome Web Store, install it manually:

1. **Clone the repository**
   ```bash
   git clone https://github.com/arun980798/phishing-guard.git
   ```

2. **Open Chrome** and navigate to:
   ```
   chrome://extensions
   ```

3. **Enable Developer Mode** using the toggle in the top-right corner.

4. Click **"Load unpacked"** and select the cloned `phishing-guard` folder.

5. The 🛡️ Phishing Guard icon will appear in your Chrome toolbar.

---

## 🧪 Testing It Out

To test phishing detection, try visiting any domain in the blacklist:

```
paypal-secure-login.com
bank-update-alert.co
verify-account-now.org
secure-login-example.net
signin-confirmation.site
```

Or open a URL with suspicious keywords (e.g. `http://192.168.1.1/login-verify-account`) to trigger the heuristic scoring.

---

## 🗂️ Permissions Explained

| Permission | Why it's needed |
|---|---|
| `tabs` | Read the current tab's URL and redirect phishing tabs to the warning page |
| `storage` | Save and retrieve the user's whitelist across sessions |
| `host_permissions: <all_urls>` | Inject the content script into every webpage |

---

## ⚠️ Known Limitations

- **Blacklist is small and static** — only 6 demo domains are included. A production version would fetch a live blocklist (e.g. Google Safe Browsing API).
- **False positives possible** — legitimate banking and account pages often trigger URL keyword checks (`login`, `secure`, `account`). Use the **Whitelist** button for trusted sites.
- **In-memory cache only** — analysis results reset when the browser restarts.
- **Email referrer detection is limited** — `document.referrer` is often empty due to modern `Referrer-Policy` headers.
- **Homograph detection is broad** — any non-ASCII character in a hostname is flagged, which may affect legitimate international domains (e.g. `münchen.de`).

---

## 🛣️ Potential Improvements

- [ ] Integrate a live blocklist (Google Safe Browsing, PhishTank)
- [ ] Add `declarativeNetRequest` rules for network-level blocking
- [ ] Persist analysis cache using `chrome.storage.session`
- [ ] Improve homograph detection with Unicode confusable character tables
- [ ] Add a history/log view of blocked sites in the popup
- [ ] Support Firefox (WebExtensions API compatibility)

---

## 🧰 Tech Stack

- **JavaScript** (ES6+) — vanilla, no frameworks
- **Chrome Extensions Manifest V3**
- **Chrome APIs**: `chrome.runtime`, `chrome.tabs`, `chrome.storage`

---

## 📄 License

This project is open source. Feel free to fork, modify, and learn from it.

---

> Built as an offline-first phishing detection tool to protect users from credential-harvesting websites without relying on any external services.
