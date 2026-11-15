# Our Stone Studio: website + live inventory agent

A public stone website (home, Full Slabs catalog, Quartz, Granite, Our Projects, Design Your Space, About Us, Contact/free consultation) with a **Live Inventory** page and an AI agent.
All stock comes from one Excel file, **LIVE INVENTORY.xlsx**, in the owner's OneDrive.

| Who | Sign-in | Can do |
|---|---|---|
| Anyone (customers, public) | none | Browse live slabs, save slabs, ask for a quote, ask the agent "Is Zircon available?" (English or Spanish, typing or voice). Read-only: no rack locations, holder names or orders. |
| Signed in, not on the staff list | Microsoft | Same as anyone (read-only). |
| Staff (`OWNER_EMAIL` + `ALLOWED_EMAILS`) | Microsoft | Everything: record sales and holds, create and cancel sales orders (PDF), Undo. |

How it fits together:

```
Visitor / staff browser ──▶ Netlify website (site/)
        │  stock questions, sales, orders
        ▼
Netlify functions (netlify/functions) ── Claude API key, staff list, owner's OneDrive connection (kept on the server)
        │
        ├──▶ Claude (the agent's brain)
        └──▶ Owner's OneDrive: LIVE INVENTORY.xlsx  (+ sales log and sales orders CSV files next to it)
```

---

## What's in this folder

| Path | What it is |
|---|---|
| `site/index.html` | Home page + the **Live Inventory** page (opens at `/#staff`) |
| `site/slabs.html` | Live slab catalog: search, filters, save, quote |
| `site/quartz.html`, `granite.html`, `projects.html`, `about.html`, `contact.html` | Content pages and the consultation form |
| `site/design.html` + `js/design.js` | Design Your Space: try in-stock stones on a kitchen with cabinet and backsplash choices |
| `site/js/projects.js` | Project gallery filter (Kitchens, Baths, Commercial, Other) |
| `site/js/config.js` | **Your settings**: company details printed on sales orders (the app ID and emails live in Netlify) |
| `site/js/site.js`, `catalog.js`, `home.js` | Public pages: live numbers, catalog (By stone / All slabs / Saved, Warm/Cool/Dark, minimum size), saved slabs, forms |
| `site/js/portal.js` | Live Inventory page (lots as tiles), the pop-up "Ask the agent" chat and the agent's tools |
| `site/js/stores.js`, `xlsxlite.js`, `stonesheet.js` | Read and write the Excel file without changing formulas or formatting |
| `site/js/auth.js` | Microsoft sign-in for staff |
| `site/css/site.css` | All styles: sage background `#E9ECE3`, white cards, pastel accents; colors and fonts in the `:root` block at the top |
| `netlify/functions/*.mjs` | Server: agent (`/api/agent`), public stock (`/api/inventory`), editor file access (`/api/file`), who-am-I (`/api/me`), OneDrive connection (`/api/connect`) |
| `netlify/lib/*` | Shared server code |
| `netlify.toml` | Hosting settings and security headers |
| `package.json` | One server package (`@netlify/blobs`), installed by Netlify automatically |

---

# Step-by-step setup (about 1 hour)

Do these in order. If your Netlify site, Azure app or Claude key already exist and still work, the step tells you what to check instead of redoing it.

## Step 0: Accounts you need (all free to start)

| Account | Used for | Link |
|---|---|---|
| GitHub | Stores the code; Netlify publishes from it | https://github.com |
| Netlify | Hosts the website and server | https://app.netlify.com |
| Microsoft account (the **owner** of the Excel file) | OneDrive file + Azure app registration | https://portal.azure.com |
| Anthropic Console | Claude API key for the agent | https://console.anthropic.com |

Turn on two-step sign-in for all four.

## Step 1: The Excel file in OneDrive

1. Sign in to https://onedrive.live.com with the owner's Microsoft account.
2. Put the inventory at **My files → Stone → LIVE INVENTORY.xlsx** (any folder works; just remember the path).
3. Write down its path **inside OneDrive**, without "My files": for example `/Stone/LIVE INVENTORY.xlsx`. Spaces and capitals must match exactly, and the ending is `.xlsx`.

You do **not** need to share the file with staff.

## Step 2: Put the code on GitHub

**Easiest (web, no tools):**
1. Unzip this project on your computer.
2. On GitHub, open your repository (or click **New** to create one, e.g. `Stone`, and choose **Private**).
3. Click **Add file → Upload files**.
4. Open the unzipped `stoneflow-site` folder, select **everything inside it** (`site`, `netlify`, `netlify.toml`, `package.json`, `README.md`, `.gitignore`) and drag it in. Folders keep their structure.
5. Click **Commit changes**.

**Or with Git (PowerShell):**
```
cd "C:\path\to\stoneflow-site"
git init
git add .
git commit -m "Our Stone Studio site"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/Stone.git
git push -u origin main
```
(If the repository already has files, run `git pull origin main --allow-unrelated-histories` before `git push`.)

Never put the Excel file, the Claude key or the Azure secret in GitHub.

## Step 3: Create (or check) the Netlify site

**New site:**
1. Netlify → **Add new project → Import an existing project → GitHub** → pick your repository.
2. Netlify reads `netlify.toml`, so leave the settings as they are (publish directory `site`, functions `netlify/functions`). Click **Deploy**.
3. Note your address, e.g. `https://marvelous11.netlify.app`. Below it's called **YOUR-SITE**.

**Existing site:** open it and check **Project configuration → Build & deploy** shows the GitHub repository and that the last deploy is **Published**.

Plan: the free plan pauses the site if monthly credits run out (each deploy uses some). For a business, use **Personal ($9/month)**.

## Step 4: Microsoft app registration (Azure)

Go to https://portal.azure.com → **App registrations**. Open **StoneFlow inventory** if it exists, or click **New registration**:
- Name: `Our Stone Studio inventory`
- Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
- Leave the redirect empty for now → **Register**.

Then set these (check each one on an existing app):

1. **Overview:** copy the **Application (client) ID**.
2. **Authentication → Add a platform → Single-page application:** `https://YOUR-SITE/` (with the slash at the end).
3. **Authentication → Add a platform → Web:** `https://YOUR-SITE/api/connect` (no slash at the end). Leave the token checkboxes unticked.

   It must look like this:

   | Platform | Redirect URI |
   |---|---|
   | Web | `https://YOUR-SITE/api/connect` |
   | Single-page application | `https://YOUR-SITE/` |

4. **Manifest:** make sure `"requestedAccessTokenVersion": 2` and `"signInAudience": "AzureADandPersonalMicrosoftAccount"`. Save.
5. **API permissions:** Microsoft Graph, Delegated: `User.Read`, `Files.ReadWrite`, `offline_access`.
6. **Certificates & secrets → New client secret** → 24 months → **Add**. Copy the **Value** column straight away (not the Secret ID). It's shown once.

Changes in Azure can take 5–10 minutes to start working.

## Step 5: Claude API key (or Claude in Microsoft Foundry)

**Option A, Anthropic Console (simplest):**

1. https://console.anthropic.com → **Billing**: add credit (e.g. $5). **Limits**: set a monthly limit (e.g. $20).
2. **API Keys → Create Key**: workspace **Default workspace**, a long expiry (90 days or 1 year). Copy the key (`sk-ant-…`).
3. The key is shown once. If you lose it, delete it and create a new one.

**Option B, Microsoft Foundry (billed on your Azure subscription; needs a paid pay-as-you-go Azure subscription, not a free trial):**

1. https://ai.azure.com → create a project → **Model catalog** → **Claude Haiku 4.5** → **Deploy** (deployment name `claude-haiku-4-5`, region **Global**).
2. Copy the endpoint (`https://YOUR-RESOURCE.services.ai.azure.com/anthropic`) and the key.
3. In step 6 use `FOUNDRY_ENDPOINT`, `FOUNDRY_API_KEY` and optional `FOUNDRY_DEPLOYMENT` instead of `ANTHROPIC_API_KEY`. If both are set, Foundry is used.
4. Add an Azure **Cost Management → Budget** with an email alert as your spend cap.

## Step 6: Netlify environment variables

Netlify → your site → **Project configuration → Environment variables → Add a variable**. Add each one (scope: **All scopes**, or at least **Functions**):

| Key | Value | Secret? |
|---|---|---|
| `MS_CLIENT_ID` | Application (client) ID from step 4 | |
| `MS_CLIENT_SECRET` | the secret **Value** from step 4 | ✅ |
| `OWNER_EMAIL` | the owner's Microsoft email, e.g. `weworkforuandus@gmail.com` | |
| `EXCEL_PATH` | `/Stone/LIVE INVENTORY.xlsx` (your path from step 1) | |
| `ALLOWED_EMAILS` | staff who may make changes, comma-separated: `you@gmail.com, puru@gmail.com` | |
| `ANTHROPIC_API_KEY` | your `sk-ant-…` key (option A) | ✅ |
| `FOUNDRY_ENDPOINT` | option B only: `https://YOUR-RESOURCE.services.ai.azure.com/anthropic` | |
| `FOUNDRY_API_KEY` | option B only: the Foundry key | ✅ |
| `FOUNDRY_DEPLOYMENT` | option B, optional: deployment name (default `claude-haiku-4-5`) | |
| `ADMIN_EMAILS` | optional: who sees the "things to check in the sheet" notes (default: `OWNER_EMAIL`) | |
| `MS_TENANT` | optional: `consumers` (default) for personal Microsoft accounts, `common` if staff also use work accounts | |
| `PUBLIC_AGENT` | optional: `off` hides the agent from visitors (they keep the free slab list) | |

Names must be exactly as shown: capitals, underscores, no spaces. A name like `sf_CLIENT_SECRET` is not found; Netlify can't rename a variable, so add it again with the right name and delete the old one.

**All emails and the client ID are set only here.** A new app registration or a new staff email never needs a code change: edit the variable and redeploy.

## Step 7: Your settings in `site/js/config.js`

On GitHub, open `site/js/config.js` → pencil icon, and check:

```js
company: "Our Stone Studio",
companyDetails: { address: "YOUR STREET, CITY, VA ZIP", phone: "999-999-9999", email: "outstonestudio@gmail.com" },
adminEmails: [],                                   // leave empty: Netlify ADMIN_EMAILS (or the owner) decides
microsoft: { clientId: "", tenant: "consumers" },  // leave clientId empty: read from Netlify MS_CLIENT_ID
excel: { sheet: "", ... },                         // empty = newest month sheet
```

**Commit changes**. Company details print on sales orders. Also replace the `[bracketed]` placeholders: street address (`contact.html`), your story (`about.html`), project photos (`projects.html`, home page) and real reviews (home page).

## Step 8: Deploy, then connect OneDrive (once)

1. Netlify → **Deploys → Trigger deploy → Deploy project**. Wait for **Published**. (Do this after every change to environment variables.)
2. Open `https://YOUR-SITE/api/connect`, sign in with the **owner** account, click **Accept**. It returns to Live Inventory.

The connection is saved on the server. Redo this only if the site says the OneDrive connection expired (after about 90 days without any use) or you change the owner account.

## Step 9: Quote form emails

Netlify → **Forms → Enable form detection**, then deploy once more. Under **Forms → Form notifications** add an email notification to `outstonestudio@gmail.com`.

## Step 10: Test

| Test | Expected |
|---|---|
| Open `https://YOUR-SITE` on your phone (not signed in) | Home shows live numbers (slabs available, colors) |
| **Slabs** page | Lots with filters; Save a slab, then **Quote my saved slabs** fills the form |
| **Live Inventory** (not signed in) | Stock list without a Rack column; agent answers "¿Hay Zircon disponible?" and refuses to sell |
| **Live Inventory → Staff sign in** with a staff email | Your name shows without "· view only"; Rack column and Sales orders appear |
| Agent: `Sold 2 slabs of IQ466` | Recorded; tap **Undo** to reverse |
| Agent: `Create a sales order for Test Client: 1 slab of IQ466 at $400` | Order number; **View → Save as PDF**; then **Cancel order** |
| Quote form on **Contact** | Message appears in Netlify Forms and your email |

Keep the Excel file **closed in desktop Excel** while testing saves.

---

## Day to day

- **Ask the agent:** on Live Inventory, tap **Ask the agent** (bottom right). Answers show picture tiles of the lots it found; tap one to open that lot.

- **New month:** add the new sheet (e.g. "DEC 2026") in Excel. The site uses the newest month sheet automatically.
- **Add staff:** add their email to `ALLOWED_EMAILS` → redeploy. They need a Microsoft account with that email (a Gmail address works if they made a free Microsoft account with it at https://account.microsoft.com).
- **Remove staff:** remove the email → redeploy.
- **Excel open?** Reading stock always works. Saving sales and orders needs the file closed in Excel (personal OneDrive locks it). Microsoft 365 Business (~$7/user/month) removes this limit.
- **Sales log and orders:** `StoneFlow sales log.csv` and `StoneFlow sales orders.csv` are created next to the Excel file.
- **Change code from your computer:** run `git pull` first, then edit, `git add .`, `git commit -m "…"`, `git push`.

## Renewals

| What | When | How |
|---|---|---|
| Claude API key | When it expires (the expiry you chose) | Create a new key → replace `ANTHROPIC_API_KEY` → redeploy |
| Azure client secret | Every 24 months | New secret → replace `MS_CLIENT_SECRET` → redeploy |
| OneDrive connection | Only after ~90 days without use | Open `/api/connect` again as the owner |

## Troubleshooting

| You see | Fix |
|---|---|
| **AADSTS9002326** (cross-origin token redemption) | The site address is under **Web** instead of **Single-page application**. Move `https://YOUR-SITE/` to Single-page application. |
| **unauthorized_client … not enabled for consumers** or **AADSTS700016** | Azure supported account types must include personal accounts; in **Manifest** set `requestedAccessTokenVersion` 2 and `signInAudience` `AzureADandPersonalMicrosoftAccount`. Wait 10 minutes. |
| **AADSTS90023** redirect_uri not valid (on `/api/connect`) | `https://YOUR-SITE/api/connect` must be under **Web**, exactly, no trailing slash. Wait 5–10 minutes, retry in a new private window. |
| **"Not set up yet. Add MS_CLIENT_ID…"** | That environment variable is missing or misspelled, or there was no deploy after adding it. |
| **"Inventory not connected yet"** | The owner opens `/api/connect` once (step 8). |
| **"The Excel file wasn't found at EXCEL_PATH"** | Fix the path: starts with `/`, no "My files", exact name, ends in `.xlsx`. Redeploy. |
| **"The Excel file is locked"** | Close it in Excel on every device (or wait a minute), then retry. |
| **"No staff are allowed yet: set ALLOWED_EMAILS"** | Add `ALLOWED_EMAILS` and redeploy. |
| Name shows **"· view only"** after staff sign-in | That email isn't in `ALLOWED_EMAILS`, or they signed in with another Microsoft account. |
| Agent: **"isn't set up: add ANTHROPIC_API_KEY"** or a Claude error | Add the key / check credit and spend limit in the Anthropic Console. |
| Quote form says "Couldn't send" | Enable form detection in Netlify (step 9) and redeploy. |
| "Site not found" (Netlify page) | The address is wrong or the project was renamed. Copy the exact address from the top of your Netlify project page. |
| Site shows old content | Press **Ctrl + F5**, or open a new private window. |

## Security

- Staff sign in with Microsoft; only `OWNER_EMAIL` and `ALLOWED_EMAILS` can change stock, checked on the server for every request.
- The Claude key, Azure secret and OneDrive connection stay on the server (Netlify); no browser gets them.
- Visitors only see a cleaned-up stock list, and their agent has only a look-up tool, rate-limited per visitor.
- OneDrive keeps version history: right-click the Excel file → **Version history** to restore an earlier copy.

## Monthly cost (as of Nov 2026)

| Item | Cost |
|---|---|
| Netlify Personal | $9 |
| Domain (optional) | ~$1–2 |
| Claude (Haiku 4.5), about 1–1.5¢ per question | ~$5–45 |
| OneDrive, Azure app, Netlify Forms (low volume) | $0 |
