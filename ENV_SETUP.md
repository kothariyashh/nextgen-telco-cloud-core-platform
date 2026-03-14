# Environment & Secrets Setup Guide

Complete step-by-step guide to fill in `.env` and make all functionality work.

---

## 1. Supabase Keys (Required – app will not start without these)

### Step 1.1: Get your Supabase API keys

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Go to **Project Settings** (gear icon) → **API**
4. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` (you already have this)
   - **anon public** (the long JWT, starts with `eyJhbGciOiJIUzI1NiIs...`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secret, starts with `eyJhbGciOiJIUzI1NiIs...`) → `SUPABASE_SERVICE_ROLE_KEY`

> **Important:** Use the **anon public** JWT key, not the new "Publishable Key" (`sb_publishable_...`). The Supabase JS client expects the JWT format.

### Step 1.2: Fix your `.env`

Your `NEXT_PUBLIC_SUPABASE_ANON_KEY` looks duplicated. Replace it with the **anon public** key from the API page:

```bash
# In .env, set:
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # paste the FULL JWT
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...     # paste the FULL service_role JWT
```

---

## 2. Database Tables (create tables in Supabase)

You reported no tables in Supabase. Run the migrations and seed.

### Option A: Run migrations from your machine (recommended)

From the project root:

```bash
npm run db:migrate
```

If that fails (e.g. ENETUNREACH), use Option B.

### Option B: Run SQL manually in Supabase

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run each migration in order:
   - Open `supabase/migrations/202603140001_initial_schema.sql` → copy all → Run
   - Open `supabase/migrations/202603140002_add_session_events_tenant_id.sql` → copy all → Run
   - Open `supabase/migrations/202603140003_add_configurations.sql` → copy all → Run
3. Run the seed:
   - Open `supabase/seed.sql` → copy all → Run

---

## 3. Other Secrets

### Auth (optional – app uses Supabase Auth, not NextAuth)

- `NEXTAUTH_SECRET` – **already generated** for you. Leave as is unless you need NextAuth.

### OAuth providers (optional – for Google / Azure SSO)

- **Google:** Create a project at [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client IDs.  
  Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- **Azure AD:** Azure Portal → App registrations → New registration.  
  Set `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`.

### Email (optional – for transactional emails)

- **Resend:** [resend.com](https://resend.com) → API Keys.  
  Set `RESEND_API_KEY`.  
  `FROM_EMAIL` is already set to `noreply@ngcmcp.com` (must be a verified domain in Resend).

### Kafka / Pulsar (optional – for event streaming)

- Set `KAFKA_BROKERS`, `KAFKA_CLIENT_ID`, `KAFKA_USERNAME`, `KAFKA_PASSWORD` when you have a broker.

### AI (you already have OpenAI)

- `OPENAI_API_KEY` – already set.
- `ANTHROPIC_API_KEY` – only if you use Anthropic features.

### Monitoring (optional)

- **Sentry:** [sentry.io](https://sentry.io) → DSN → `SENTRY_DSN`
- **PostHog:** [posthog.com](https://posthog.com) → Project API Key → `POSTHOG_KEY`

### Kubernetes (optional – for NF orchestration)

- `KUBECONFIG_BASE64` – base64-encoded kubeconfig
- `HELM_REGISTRY_URL` – Helm chart registry URL

---

## 4. Verify setup

After setting Supabase keys and running migrations:

```bash
# Run dev server
npm run dev
```

Open `http://localhost:3000`. You should be able to:

- Visit public pages (home, login, signup)
- Sign up / sign in via Supabase Auth
- Access the protected `/app` dashboard (after login)
- See demo data (Demo Operator tenant, subscribers, NF, slices, etc.)

---

## 5. Summary – what you must do now

1. **Supabase keys:** Replace `NEXT_PUBLIC_SUPABASE_ANON_KEY` and set `SUPABASE_SERVICE_ROLE_KEY` with values from Project Settings → API.
2. **Create tables:** Run `npm run db:migrate` or run the migration SQL files in the Supabase SQL Editor.
3. **Confirm:** Start the app with `npm run dev` and test the flow.

The app will work with only Supabase URL, anon key, and service role key. Everything else is optional and only enables extra features.
