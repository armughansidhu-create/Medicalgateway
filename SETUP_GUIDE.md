# MedicalGateway — Setup Guide
## Follow these steps IN ORDER. Do not skip any step.

---

## STEP 1 — Install tools on your PC (one time only)

1. **Node.js** → go to https://nodejs.org → download "LTS" version → install
2. **VS Code** → go to https://code.visualstudio.com → download → install
3. **Git** → go to https://git-scm.com → download → install

After installing, open **Command Prompt** (Windows: press Win+R, type cmd, press Enter) and run:
```
node --version
```
You should see something like `v20.x.x`. If yes, Node.js is ready.

---

## STEP 2 — Create your 5 accounts (one time only)

1. **GitHub** → https://github.com → Sign up (free)
2. **Vercel** → https://vercel.com → Sign up with GitHub (free)
3. **Supabase** → https://supabase.com → Sign up → Create new project
   - Project name: `medicalgateway`
   - Database password: save this somewhere safe
   - Region: Choose closest (Singapore is fine)
   - After project loads, go to Settings → API → copy:
     - `Project URL`
     - `anon public` key
     - `service_role` key (keep this secret!)

4. **Stripe** → https://stripe.com → Sign up
   - Go to Developers → API Keys → copy Secret Key and Publishable Key
   - Create two products:
     - "MBBS Complete" → PKR 4,800 → yearly → copy Price ID
     - "Single Year" → PKR 3,600 → yearly → copy Price ID

5. **Namecheap** → https://namecheap.com → Search `medicalgateway.pk` → purchase (~PKR 3,400/yr)

---

## STEP 3 — Set up the database

1. Go to your Supabase project → click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `supabase_schema.sql` from this project
4. Copy ALL the text and paste it into the SQL Editor
5. Click **Run** (green button)
6. You should see "Success" — all your tables are now created with all 21 subjects pre-loaded

---

## STEP 4 — Configure environment variables

1. In the project folder, find the file `.env.example`
2. Copy it and rename the copy to `.env.local`
3. Open `.env.local` in VS Code and fill in all the values:
   - Paste your Supabase URL and keys
   - Paste your Stripe keys and Price IDs
   - Set `NEXT_PUBLIC_APP_URL=https://medicalgateway.pk`
   - Set `ADMIN_EMAIL=your@email.com` (this account gets admin access)

---

## STEP 5 — Run the website on your computer

Open Command Prompt, navigate to the project folder:
```
cd C:\path\to\medicalgateway
npm install
npm run dev
```

After a minute, open your browser and go to: **http://localhost:3000**

You should see the MedicalGateway homepage! 🎉

---

## STEP 6 — Deploy to the internet (Vercel)

1. Open Command Prompt in the project folder and run:
```
git init
git add .
git commit -m "Initial MedicalGateway build"
```

2. Go to https://github.com → New Repository → name it `medicalgateway` → Create

3. Run these commands (replace YOUR_USERNAME with your GitHub username):
```
git remote add origin https://github.com/YOUR_USERNAME/medicalgateway.git
git branch -M main
git push -u origin main
```

4. Go to https://vercel.com → New Project → Import `medicalgateway` from GitHub

5. In Vercel, before clicking Deploy, click **Environment Variables** and add ALL values from your `.env.local` file

6. Click **Deploy** — wait 2 minutes — your site is LIVE! 🚀

---

## STEP 7 — Connect your domain

1. In Vercel → your project → Settings → Domains → Add `medicalgateway.pk`
2. Vercel will show you two nameserver values (like `ns1.vercel-dns.com`)
3. Go to Namecheap → your domain → Nameservers → paste Vercel's nameservers
4. Wait up to 24 hours — your site will be live at medicalgateway.pk with HTTPS

---

## STEP 8 — Set up Stripe webhook

1. Go to https://dashboard.stripe.com → Developers → Webhooks → Add endpoint
2. URL: `https://medicalgateway.pk/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
4. Copy the Webhook Signing Secret and add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`
5. Redeploy Vercel (it will auto-redeploy when you push any change)

---

## STEP 9 — Upload your first MCQs

1. Go to https://medicalgateway.pk/admin/upload
   (You must be logged in with the email you set as ADMIN_EMAIL)
2. Select a subject from the dropdown
3. Upload your Excel file (use the MedPrepPK_MCQ_Template.xlsx format)
4. Click Upload — your MCQs are live instantly!

---

## STEP 10 — Make your account admin

After creating your account on the website, go to Supabase → Table Editor → `user_profiles` → find your row → change `role` from `student` to `super_admin` → Save.

Now you have full admin access.

---

## Troubleshooting

**"npm: command not found"** → Node.js didn't install correctly. Restart your PC and try again.

**"Cannot find module"** → Run `npm install` again in the project folder.

**Stripe payments not working** → Check that your webhook is configured correctly and the `STRIPE_WEBHOOK_SECRET` is set in Vercel.

**Site not loading after domain change** → DNS can take up to 24 hours. Wait and try again.

**MCQ upload fails** → Check that your Excel file uses the correct column names (MCQ_ID, Question, Option_A, Option_B, Option_C, Option_D, Correct_Answer). They must match exactly.

---

## Need help?
Open Claude (claude.ai) and describe exactly what error you see. Claude will fix it.
