# Setup guide — card on file + chat widget

This walks through everything needed to turn on two new features:

1. **Card on file that actually works.** Right now, when someone signs up on
   `quote.html`, their card gets tokenized by Stripe but then just sits in an
   email — it's never actually saved anywhere. After this setup, it gets
   saved as a real card on file inside Sweep&Go, and you get a text
   confirming the signup.
2. **A chat bubble** on every page of the site. A visitor types a message →
   you get a text. You reply to that text → your reply shows up back in
   their chat window on the site.

Nothing is live yet — the code is written, but it needs your account
credentials plugged in before it can actually talk to Sweep&Go and
GoHighLevel (GHL). That's what this guide walks through. There are 4 parts:

- **Part 1** — collect 6 pieces of information from your other accounts (15-20 min)
- **Part 2** — paste them into 3 places (5 min)
- **Part 3** — one-time setup inside GHL so your text replies reach the chat widget (10 min)
- **Part 4** — test it, then deploy (whenever you're ready)

You can do this over multiple sittings — nothing breaks if you stop halfway.

---

## Part 1 — Collect 6 values

Open a blank note (Notes app, a Google Doc, whatever) and collect these one
at a time. Label each one exactly as shown so you don't mix them up.

### 1. `SWEEPANDGO_API_TOKEN`

1. Log into your Sweep&Go dashboard.
2. Go to **Settings**.
3. Look for **Open API** (sometimes listed as "API" or "Integrations").
4. Click **Generate API Token** (or "Create Token" — wording may vary
   slightly).
5. Copy the long string it gives you. It will look like a random jumble of
   letters and numbers.
6. Paste it into your note as `SWEEPANDGO_API_TOKEN`.

If you can't find this menu, search Sweep&Go's help docs for "Open API" or
contact their support — the option exists, it's just not always in the same
spot on every plan.

### 2. `GHL_PRIVATE_INTEGRATION_TOKEN`

1. Log into GoHighLevel (GHL).
2. Go to **Settings** (bottom-left, gear icon) → **Private Integrations**.
3. Click **Create New Integration** (or similar button).
4. Give it a name like "Dirty Dawgs Website".
5. When it asks which permissions/scopes to grant, turn on:
   - **Contacts** — Read and Write
   - **Conversations** — Read and Write
   - **Conversations/Messages** — Read and Write
   (If you see slightly different names, just enable anything related to
   Contacts and Conversations/Messages.)
6. Save/Create it. GHL will show you a token **one time only** — if you
   navigate away before copying it, you'll have to delete it and make a new
   one.
7. Copy it into your note as `GHL_PRIVATE_INTEGRATION_TOKEN`.

### 3. `GHL_LOCATION_ID`

1. Still in GHL, go to **Settings** → **Business Info** (sometimes called
   "Business Profile").
2. Look for a field called **Location ID** — it's usually near the top or in
   the URL of the settings page itself. If you're on the settings page, you
   can also often find it in the browser's address bar — it's the string of
   letters/numbers right after `/location/` in the URL.
3. Copy it into your note as `GHL_LOCATION_ID`.

### 4. `GHL_OWNER_PHONE`

This is just your own cell phone number — the one that should receive text
alerts for new signups and chat messages.

Write it in your note **with the country code and a plus sign**, no spaces
or dashes, like: `+16783279646`

### 5. `GHL_WEBHOOK_SHARED_SECRET`

This one you make up yourself — think of it like a password that only your
website and GHL know, so nobody else can pretend to be GHL and mess with
your chat widget. Just type a long random string, e.g. mash your keyboard
for 20-30 characters, or use a phrase like `dd-chat-9x7Lm2Qp-secret`.

Write whatever you chose into your note as `GHL_WEBHOOK_SHARED_SECRET`.
(There's nothing to "get" from anywhere for this one — you're inventing it.)

### 6. `TRIGGER_SECRET_KEY` — already done

This one's already set for you in `.env` — no action needed. (It's the key
that lets your code talk to Trigger.dev, the service that runs the
behind-the-scenes automation.)

**Checkpoint:** your note should now have 5 values written down (the 6th,
`TRIGGER_SECRET_KEY`, is already in place).

---

## Part 2 — Paste those values into 3 places

Each value needs to live in 3 places so that it works both while you're
testing on your computer (local) and once it's live on the internet
(production). Tedious but only needs doing once.

### A. Your `.env` file (for testing on your computer)

1. In this project folder, find the file named `.env` (already created —
   if your file browser hides files starting with a dot, use a text editor
   like VS Code, or `Cmd+Shift+.` in macOS Finder to reveal hidden files).
2. Open it in any text editor.
3. You'll see lines like `SWEEPANDGO_API_TOKEN=` — type or paste your value
   right after the `=` sign, no spaces, no quotes. Example:
   ```
   SWEEPANDGO_API_TOKEN=abc123yourrealtokenhere
   ```
4. Do this for all 5 values from Part 1.
5. Save the file.

This file is already excluded from Git (via `.gitignore`), so it will never
accidentally get uploaded anywhere public.

### B. The Trigger.dev dashboard (for the automation to run for real)

1. Go to [cloud.trigger.dev](https://cloud.trigger.dev) and log in.
2. Open the **Dirty Dawgs Website** project.
3. In the left sidebar, click **Environment Variables**.
4. You'll need to add each of the 5 values **twice** — once for the `Dev`
   environment and once for `Prod`. There's usually a toggle or separate tab
   for each. Add all 5 to both.
5. Use the exact same names as in your `.env` file (e.g.
   `SWEEPANDGO_API_TOKEN`, `GHL_PRIVATE_INTEGRATION_TOKEN`, etc.)

### C. The Vercel dashboard (for the website itself — this is what actually serves dogpoopsmells.com)

1. Go to [vercel.com](https://vercel.com) and log in.
2. Open the project connected to **dogpoopsmells.com**.
3. Go to **Settings** → **Environment Variables**.
4. Add each of the 5 values. Vercel will ask which environments each one
   applies to (Production / Preview / Development) — select all three so it
   works everywhere.

**Checkpoint:** all 5 values now exist in your `.env` file, in Trigger.dev
(both Dev and Prod), and in Vercel.

---

## Part 3 — One-time setup inside GHL

This step is what makes your text replies show up back in the chat widget
on the website. Without it, the chat bubble still works for sending you
messages — it just can't relay your reply back.

1. In GHL, go to **Automation** → **Workflows** → **Create Workflow** (or
   **+ New Workflow**). Start from a blank workflow.
2. Name it something like "Website Chat Reply Relay".
3. **Add a Trigger:**
   - Choose **Customer Replied** (this may also be called "Inbound
     Message" depending on your GHL version).
   - If it gives you the option to filter/scope the trigger, add a
     condition: **Contact Tag** is `dirty-dawgs-owner`. (That tag gets
     applied automatically to your own contact record the very first time
     the website texts you — you don't need to create it by hand. If the
     workflow builder won't let you type a tag that doesn't exist yet
     inside GHL, just skip this filter for now and add it later once
     you've received your first test text — see Part 4.)
4. **Add an Action:**
   - Choose **Webhook**.
   - **URL**: enter this, with the shared secret you made up in Part 1, step 5:
     ```
     https://www.dogpoopsmells.com/api/ghl-inbound?secret=YOUR_SHARED_SECRET
     ```
   - **Method**: POST
   - Under **Custom Data** (or "Body"), add a field named `message` and set
     its value to whatever GHL calls "the message body" / "reply text" in
     its list of available merge fields for this trigger — this is usually
     something like `{{message.body}}`.
5. **Save and Publish/Activate** the workflow. An inactive workflow won't do
   anything.

**Known limitation for now:** if you're texting back-and-forth with two
different website visitors' chats at the exact same time, your reply will
go to whichever one is still open and most recent — there's no way yet for
a plain text reply to say which visitor it's meant for. For a small
business this is unlikely to come up often; it can be improved later if it
becomes a real issue.

---

## Part 4 — Test it, then deploy

### Test on your computer first

You'll need two terminal windows open at the same time, both in this
project folder.

**Terminal 1** — starts the automation engine:
```bash
npm run dev:trigger
```
Leave this running. It will print logs whenever something happens.

**Terminal 2** — serves the website locally, the same way it'll work once
live:
```bash
npx vercel dev
```
(First time only, it may ask you to log in and link this folder to your
Vercel project — say yes to both.) This will print a local address, usually
`http://localhost:3000`.

**Test the signup/card-on-file flow:**
1. Open `http://localhost:3000/quote.html` in your browser.
2. Get a quote and fill out the signup form.
3. For the card field, use Stripe's official test card — it's not real
   money, it's specifically for testing: card number `4242 4242 4242 4242`,
   any future expiration date, any 3-digit CVC, any ZIP.
4. Submit. Watch Terminal 1 — you should see a `submit-signup` run appear.
5. Check your phone — you should get a text confirming the signup with a
   card brand/last-4 (Stripe's test card shows as "Visa ••4242").

**Test the chat widget:**
1. On any page at `http://localhost:3000`, click the chat bubble
   (bottom-right).
2. Type a message and send it.
3. Watch Terminal 1 for a `chat-message` run, and check your phone for the
   text.
4. Reply to that text from your phone.
5. This last part (the reply making it back to the chat widget) only works
   once Part 3's webhook is set up **and** reachable from the internet —
   your local computer isn't normally reachable from GHL's servers. To test
   this specific piece before deploying, you'd need a tool like `ngrok` to
   temporarily expose your local server — optional, and skippable if you'd
   rather just verify it after deploying instead.

### Deploy — only when you're ready and say so

Same rule as always: nothing goes live until you've tested it and tell me
to deploy. When you're ready, deploying is two steps:

```bash
npm run deploy:trigger
```
This pushes the automation tasks to Trigger.dev's production environment.

Then, pushing this repo's code to the `main` branch on GitHub will make
Vercel automatically redeploy dogpoopsmells.com itself (same as it already
does today) — I'll handle the actual `git push` when you say go.

After deploying, do one real end-to-end test on the live site (a real
signup with a real card, or ask a friend to try the chat) to make sure
everything's connected correctly in production, not just locally.
