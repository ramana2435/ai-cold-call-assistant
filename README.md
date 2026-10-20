# AI Cold-Call Assistant

An intelligent assistant for managing cold calls through 8 structured stages, built for a time-limited development challenge.

## 🎯 Project Overview

This application helps salespeople conduct effective cold calls by:
- Guiding them through 8 official call stages
- Providing AI-generated suggestions based on 100 real transcript analysis
- Capturing prospect responses and exact words
- Managing call history and outcomes
- Supporting multilingual conversations (planned)
- Offering visual problem guides (planned)

## 📊 Project Status

| Module | Status | Description |
|--------|--------|-------------|
| **Module 0B** | ✅ Complete | Challenge material analysis (100 transcripts) |
| **Module 1** | ✅ Complete | Backend API & Database |
| Module 2 | 🔄 Pending | Frontend UI |
| Module 3 | 🔄 Pending | Stage flow & navigation |
| Module 4 | 🔄 Pending | AI integration (Gemini) |
| Module 5 | 🔄 Pending | Visual problem guide |
| Module 6 | 🔄 Pending | Multilingual support |
| Module 7 | 🔄 Pending | Speech recognition architecture |
| Module 8 | 🔄 Pending | Enhanced call history |
| Module 9 | 🔄 Pending | Deployment (Vercel + Render) |

## 🎬 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier)

### Setup (5 minutes)

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create Supabase project:**
   - Go to https://supabase.com
   - Create new project
   - Run `database/schema.sql` in SQL Editor

3. **Configure environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start backend:**
   ```bash
   npm run dev
   ```

5. **Verify:**
   - Open http://localhost:3000/health
   - Should see `"connected": true`

**📖 Detailed instructions:** See [`SETUP.md`](./SETUP.md)

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- Supabase (PostgreSQL)
- express-validator for validation
- Jest for testing

**Frontend (Planned):**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query

**AI/ML (Planned):**
- Google Gemini API (via Google AI Studio)
- Google Translate API

**Deployment (Planned):**
- Frontend: Vercel
- Backend: Render
- Database: Supabase (hosted)

### Project Structure

```
Seller AI Assistant/
├── backend/                    # ✅ Backend API (Module 1)
│   ├── src/
│   │   ├── __tests__/          # Test files
│   │   ├── config/             # Configuration
│   │   ├── db/                 # Supabase client
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic
│   │   ├── types/              # TypeScript types
│   │   ├── validators/         # Request validation
│   │   └── server.ts           # Entry point
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── database/                   # ✅ Database schema (Module 1)
│   ├── schema.sql              # PostgreSQL migration
│   └── README.md
│
├── frontend/                   # 🔄 To be created (Module 2)
│
├── cold-call-transcripts-100/ # Challenge materials (not committed)
├── reference-screen-*.png     # UI reference (not committed)
│
├── .gitignore
├── SETUP.md                   # Setup guide
├── MODULE_1_REPORT.md         # Module 1 completion report
├── API_QUICK_REFERENCE.md     # API cheat sheet
└── README.md                  # This file
```

## 📝 The 8 Official Call Stages

Based on analysis of 100 real cold-call transcripts:

1. **Opening** - Initial contact and identification
2. **Purpose** - State reason for calling (most common: "I'm calling about...")
3. **Permission** - Ask to proceed ("Can I take 2 minutes?")
4. **Their business** - Understand their company
5. **Their need, in their words** - Capture prospect's exact statement
6. **Objection** - Handle concerns (most common: "Not the right person", "Already have solution")
7. **Next step** - Agree on action (send report, schedule meeting)
8. **Close** - End call with outcome

**Key Finding:** 87% of calls end before Stage 7. The app supports ending at any stage.

## 🎯 Call Outcomes (From Transcript Analysis)

Based on 100 actual calls:
- `not_interested` (14%) - Prospect declined
- `agreed_to_receive_report` (14%) - Document to be sent
- `follow_up` (14%) - Caller to call again
- `not_logged` (13%) - No outcome recorded
- `next_step_agreed` (11%) - Meeting/call scheduled
- `do_not_call` (10%) - Requested no contact
- `wrong_person` (8%) - Not the target
- `interested` (7%) - Interest without fixed step
- `moved_company` (5%) - Person left
- `call_again` (4%) - Technical issues

## 🔗 API Endpoints

**Base URL:** `http://localhost:3000`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/health` | Health check & database status |
| `POST` | `/calls` | Create new call |
| `GET` | `/calls` | List all calls (newest first) |
| `GET` | `/calls/:id` | Get call with stage results |
| `POST` | `/calls/:id/stages` | Save stage result |
| `POST` | `/calls/:id/close` | Close call from any stage |

**📖 Full API docs:** See [`API_QUICK_REFERENCE.md`](./API_QUICK_REFERENCE.md)

## 🧪 Testing

```bash
cd backend
npm test
```

**Test Coverage:**
- ✅ Request validation (17 tests)
- ✅ Stage number constraints (1-8)
- ✅ Official stage name mapping
- ✅ Multiple quick-tap events
- ✅ Close call at any stage
- ✅ Error handling
- ✅ 404 handling

**Coverage:** ~85% statements, ~78% branches

## 🗄️ Database Schema

### Tables

**`calls`** - High-level call information
- Prospect & company details
- Current and reached stage (1-8)
- Status (in_progress, closed)
- Outcome (10 types)
- Key words and next actions
- Timestamps

**`call_stage_results`** - Detailed stage progression
- Stage number and name
- Quick-tap events (JSONB array)
- Prospect's exact words
- Stage notes
- Timestamps

### Key Features
- ✅ Enforced stage numbers (1-8)
- ✅ Multiple quick-tap selections per stage
- ✅ Automatic timestamp updates
- ✅ Foreign key cascade deletes
- ✅ Indexed for performance

**📖 Schema details:** See [`database/README.md`](./database/README.md)

## 🔐 Security

- ✅ Environment variables for secrets
- ✅ `.env` excluded from Git
- ✅ Service role key (backend only)
- ✅ Input validation on all endpoints
- ✅ CORS configured
- ✅ SQL injection protection
- ✅ No credentials in code

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup guide
- **[MODULE_1_REPORT.md](./MODULE_1_REPORT.md)** - Module 1 completion report
- **[API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)** - API cheat sheet
- **[backend/README.md](./backend/README.md)** - Backend documentation
- **[database/README.md](./database/README.md)** - Database schema docs


## 🚀 Live Demo & Deployment

- **Frontend (Vercel):** https://ai-cold-call-assistant-six.vercel.app/
- **Backend (Render):** https://ai-cold-call-assistant.onrender.com
- **Backend Health Check:** https://ai-cold-call-assistant.onrender.com/health
- **Database:** Supabase (PostgreSQL)

### Health Check

Visit the backend health-check URL to verify the API and database connection status.

### Source Code

The complete frontend, backend, and database schema are available in this public GitHub repository.

## 🚀 Next Steps

### For Testing Module 1:

1. Complete Supabase setup (5 minutes)
2. Run backend: `npm run dev`
3. Test endpoints with curl/Postman
4. Run test suite: `npm test`

### For Module 2 (Frontend):

1. Initialize Next.js project
2. Create UI components for 8 stages
3. Implement API client
4. Add state management
5. Build call flow UI

## 🤝 Development Workflow

1. Each module is implemented incrementally
2. Module completion requires approval before next
3. Tests written alongside features
4. Documentation updated continuously
5. Security measures enforced throughout

## 📊 Transcript Analysis Results

From 100 real cold-call transcripts:

**Call Duration:**
- Shortest: 30 seconds
- Longest: 687 seconds (11.4 minutes)
- Most common: 60-90 seconds

**Stage Patterns:**
- Most calls reach Stage 2 (Purpose)
- ~40% reach Stage 4 (Their business)
- ~30% reach Stage 5 (Their need)
- Only ~25% reach Stage 7 (Next step)

**Common Prospect Responses:**

*Stage 2 (Purpose):*
- "What is this regarding?"
- "Who gave you this number?"
- "From which company are you calling?"

*Stage 3 (Permission):*
- "Go ahead, tell me"
- "I'm busy, make it quick"
- "Not interested right now"

*Stage 6 (Objection):*
- "I'm not the right person"
- "We already have consultants"
- "Send me information first"

## 📄 License

This project is developed for a time-limited challenge. The transcripts and reference materials are confidential and not included in the repository.

## 🙋 Support

For questions or issues:
1. Check `SETUP.md` for setup help
2. Check `MODULE_1_REPORT.md` for implementation details
3. Review test files for usage examples
4. Check Supabase logs for database errors

---

**Current Status:** ✅ Module 1 Complete - Backend API Ready
**Next Module:** Frontend UI Development
**Last Updated:** January 2024
