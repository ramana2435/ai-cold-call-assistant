# AI Cold-Call Assistant - Complete Setup Guide

## Project Status: Module 1 Complete ✅

Backend API and database schema have been implemented and are ready for Supabase connection.

---

## Prerequisites

- **Node.js** 18+ and npm
- **Supabase** account (free tier available at https://supabase.com)
- **Git** (optional, for version control)

---

## Quick Start Guide

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

**Note:** This may take 2-3 minutes. Deprecation warnings are normal and don't affect functionality.

### Step 2: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name:** cold-call-assistant
   - **Database Password:** (save this)
   - **Region:** Choose closest to you
4. Wait for project to be created (~2 minutes)

### Step 3: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Open `database/schema.sql` from this project
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run** or press `Ctrl+Enter`
6. Verify success message appears

### Step 4: Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **service_role key** (in "Project API keys" section, not the anon key)

### Step 5: Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` file with your credentials:

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

CORS_ORIGINS=http://localhost:3001,http://localhost:5173
```

**⚠️ Security Warning:**
- Never commit `.env` to Git
- Use service_role key, NOT anon key
- The `.gitignore` file is already configured to exclude it

### Step 6: Start the Backend

```bash
npm run dev
```

You should see:

```
============================================================
🚀 AI Cold-Call Assistant Backend
============================================================
📡 Server running on port 3000
🌍 Environment: development
🔗 Health check: http://localhost:3000/health
📊 API base URL: http://localhost:3000
============================================================
```

### Step 7: Verify Setup

Open http://localhost:3000/health in your browser or run:

```bash
curl http://localhost:3000/health
```

**Expected response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {
      "connected": true
    },
    "timestamp": "2024-01-15T..."
  }
}
```

If you see `"connected": true`, setup is complete! ✅

---

## Testing the API

### Create a Call

```bash
curl -X POST http://localhost:3000/calls \
  -H "Content-Type: application/json" \
  -d '{
    "prospect_name": "Dr. Anjali Menon",
    "company_name": "Menon Family Clinic",
    "prospect_role": "Owner",
    "call_context": "first call"
  }'
```

### List All Calls

```bash
curl http://localhost:3000/calls
```

### Save Stage Result

Replace `CALL_ID` with the ID from create response:

```bash
curl -X POST http://localhost:3000/calls/CALL_ID/stages \
  -H "Content-Type: application/json" \
  -d '{
    "stage_number": 2,
    "quick_tap_events": ["Asked what we do", "Said make it quick"],
    "prospect_words": "What is this regarding?"
  }'
```

### Close a Call

```bash
curl -X POST http://localhost:3000/calls/CALL_ID/close \
  -H "Content-Type: application/json" \
  -d '{
    "reached_stage_number": 3,
    "outcome": "not_interested",
    "prospect_key_words": "Not the right time"
  }'
```

---

## Run Tests

```bash
npm test
```

**Tests include:**
- ✅ Health endpoint validation
- ✅ Stage number constraints (1-8)
- ✅ Official stage name mapping
- ✅ Invalid UUID rejection
- ✅ Required field validation
- ✅ Multiple quick-tap events support
- ✅ Outcome enum validation
- ✅ Closing at different stages
- ✅ 404 handling

---

## Troubleshooting

### "degraded" health status

**Problem:** Health check shows `"status": "degraded"`

**Solutions:**
1. Verify `.env` file exists with correct credentials
2. Check that `SUPABASE_URL` starts with `https://`
3. Ensure you're using **service_role key**, not anon key
4. Verify Supabase project is active (not paused)

### Database connection fails

**Problem:** `"connected": false` or connection timeout

**Solutions:**
1. Go to Supabase dashboard → Settings → Database
2. Check connection pooling is enabled
3. Verify your IP isn't blocked (Supabase → Settings → Auth → IP restrictions)
4. Try restarting Supabase project if recently created

### Port 3000 already in use

**Problem:** `EADDRINUSE: address already in use`

**Solutions:**
1. Change `PORT=3001` in `.env`
2. Or stop the process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

### npm install takes too long

**Problem:** Installation hangs or times out

**Solutions:**
1. Clear npm cache: `npm cache clean --force`
2. Try with different registry: `npm install --registry https://registry.npmjs.org`
3. Check internet connection
4. Close other applications to free up memory

### Tests fail with "Call not found"

**Problem:** Tests expect database operations

**Solution:** The mock tests don't require database connection. If you see database errors:
1. Ensure `.env` is configured (for integration tests)
2. Run mock tests only: `npm test -- --testPathPattern=mock`

---

## Project Structure

```
Seller AI Assistant/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── __tests__/          # Test files
│   │   ├── config/             # Configuration
│   │   ├── db/                 # Supabase client
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   ├── types/              # TypeScript types
│   │   ├── validators/         # Request validation
│   │   ├── app.ts             # Express setup
│   │   └── server.ts          # Entry point
│   ├── .env.example           # Environment template
│   ├── .env                   # Your credentials (not committed)
│   ├── package.json           # Dependencies
│   └── README.md              # Backend docs
│
├── database/                   # Database files
│   ├── schema.sql             # Database migration
│   └── README.md              # Database docs
│
├── cold-call-transcripts-100/ # Challenge materials (not committed)
├── reference-screen-*.png     # UI reference (not committed)
├── .gitignore                 # Git exclusions
└── SETUP.md                   # This file
```

---

## What's Next?

After completing Module 1:

- **Module 2:** Frontend UI (React/Next.js)
- **Module 3:** Stage flow and navigation
- **Module 4:** AI integration (Gemini API)
- **Module 5:** Visual problem guide
- **Module 6:** Multilingual support
- **Module 7:** Speech recognition (architecture)
- **Module 8:** Call history and details
- **Module 9:** Deployment (Vercel + Render)

---

## Support

If you encounter issues not covered here:

1. Check `backend/README.md` for API documentation
2. Check `database/README.md` for schema details
3. Review test files in `backend/src/__tests__/` for examples
4. Check Supabase project logs: Dashboard → Logs
5. Enable debug logging:
   ```env
   NODE_ENV=development
   ```

---

## Security Checklist

Before committing to Git:

- ✅ `.env` is in `.gitignore`
- ✅ No credentials in source code
- ✅ Challenge transcripts excluded from Git
- ✅ Reference screenshots excluded from Git
- ✅ Service role key never exposed to frontend
- ✅ CORS configured for specific origins

---

**Module 1 Status:** ✅ Complete and ready for frontend development
