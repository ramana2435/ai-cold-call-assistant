# Module 1: Speech-to-Text MVP - Setup & Testing Guide

## Overview

This module adds real-time microphone transcription using AssemblyAI's streaming API. The implementation follows a WebSocket architecture where the backend manages the AssemblyAI connection to keep the API key secure.

**Important Limitation:** This MVP captures audio from the salesperson's microphone only. It does NOT record telephone calls or capture both sides of a conversation.

---

## Files Modified/Created

### Backend
- ✅ `backend/package.json` - Added `assemblyai` SDK dependency
- ✅ `backend/.env.example` - Added `ASSEMBLYAI_API_KEY`
- ✅ `backend/src/config/index.ts` - Added AssemblyAI configuration
- ✅ `backend/src/types/index.ts` - Added speech-to-text types
- ✅ `backend/src/services/speechService.ts` - NEW: Speech transcription service
- ✅ `backend/src/services/websocketHandler.ts` - NEW: WebSocket server handler
- ✅ `backend/src/routes/speech.ts` - NEW: Speech API routes
- ✅ `backend/src/app.ts` - Registered speech routes
- ✅ `backend/src/server.ts` - Added WebSocket server setup
- ✅ `database/schema.sql` - Added `transcript_segments` table

### Frontend
- ⏳ `frontend/src/components/AudioPanel.tsx` - NEW: Microphone UI component
- ⏳ `frontend/src/components/CallWorkspace.tsx` - Integrate AudioPanel
- ⏳ `frontend/src/types/index.ts` - Add transcript types

---

## Installation Steps

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# The assemblyai package should now be installed (v4.8.0)
```

### 2. Get AssemblyAI API Key

1. Go to https://www.assemblyai.com/
2. Sign up for a free account
3. Navigate to your Dashboard
4. Copy your API key

### 3. Configure Environment

Edit `backend/.env` and add:

```env
ASSEMBLYAI_API_KEY=your-actual-api-key-here
```

**NEVER commit this key to Git!**

### 4. Update Database Schema

Run the new schema additions in your Supabase SQL Editor:

```bash
# Copy the transcript_segments table definition from database/schema.sql
# Lines starting with "-- Table: transcript_segments"
# Paste and execute in Supabase SQL Editor
```

The schema adds:
- `transcript_segments` table
- Indexes for performance
- Row-level security (RLS enabled, backend-only access)

### 5. Build and Start Backend

```bash
cd backend
npm run build
npm run dev
```

You should see:
```
🚀 AI Cold-Call Assistant Backend
📡 Server running on port 3000
🎙️  WebSocket: ws://localhost:3000/ws
```

### 6. Start Frontend

```bash
cd frontend
npm run dev
```

---

## API Endpoints

### Speech Transcription

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `ws://localhost:3000/ws/calls/:id/transcribe` | WebSocket | Real-time audio streaming |
| `GET /calls/:id/transcript` | GET | Get transcript segments |
| `GET /calls/:id/transcript/full` | GET | Get full transcript text |
| `POST /calls/:id/transcript/test` | POST | Store test transcript (for testing) |

---

## Testing the Implementation

### Test 1: Backend API (Without Audio)

Test the transcript storage endpoint:

```bash
# Create a test call first
curl -X POST http://localhost:3000/calls \
  -H "Content-Type: application/json" \
  -d '{
    "prospect_name": "Test User",
    "company_name": "Test Company"
  }'

# Note the call ID from response, then:
curl -X POST http://localhost:3000/calls/YOUR_CALL_ID/transcript/test \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test transcript",
    "is_final": true
  }'

# Retrieve transcripts
curl http://localhost:3000/calls/YOUR_CALL_ID/transcript

# Get full transcript text
curl http://localhost:3000/calls/YOUR_CALL_ID/transcript/full
```

### Test 2: WebSocket Connection

Use a WebSocket client (e.g., websocat, wscat) to test:

```bash
# Install wscat if needed
npm install -g wscat

# Connect to WebSocket (replace CALL_ID)
wscat -c "ws://localhost:3000/ws/calls/YOUR_CALL_ID/transcribe"

# You should see: {"type":"session_start","session_id":"..."}
```

### Test 3: Frontend Microphone Transcription

1. Open browser to `http://localhost:5173`
2. Create a new call or open an existing call
3. In the Call Workspace, find the "🎙️ Microphone Transcription" panel
4. Click "Start Listening"
5. Allow microphone access when prompted
6. Speak into your microphone
7. Watch live transcripts appear (partial = gray, final = black)
8. Click "Stop Listening" when done

**Expected Behavior:**
- ✅ Microphone permission requested
- ✅ Status changes to "🎙️ Listening... (microphone active)"
- ✅ Red recording indicator appears
- ✅ Partial transcripts appear in gray as you speak
- ✅ Final transcripts appear in black when you pause
- ✅ Transcripts are stored in database (final only)

---

## Troubleshooting

### Error: "AssemblyAI API key not configured"

**Cause:** `ASSEMBLYAI_API_KEY` not set in `backend/.env`

**Solution:**
1. Add the key to `backend/.env`
2. Restart the backend server

### Error: "Call not found or not in progress"

**Cause:** Call ID is invalid or call status is "closed"

**Solution:**
- Ensure you're using a valid UUID for an open call
- Only open calls (status='in_progress') support transcription

### Error: "Microphone access denied"

**Cause:** Browser blocked microphone access

**Solution:**
1. Click the camera/microphone icon in browser address bar
2. Allow microphone access for localhost
3. Refresh the page and try again

### No transcripts appearing

**Possible causes:**
1. Microphone not working - test in browser settings
2. Speaking too quietly - speak closer to microphone
3. Network issue - check browser console for WebSocket errors
4. AssemblyAI service issue - check backend logs

**Debug steps:**
1. Open browser DevTools (F12) → Console tab
2. Look for `[AudioPanel]` or `[WebSocket]` messages
3. Check backend terminal for `[WebSocket]` logs
4. Verify WebSocket connection: should see "WebSocket connected"

### WebSocket connection fails

**Error:** `WebSocket connection to 'ws://localhost:3000/ws/...' failed`

**Solution:**
1. Ensure backend is running (`npm run dev` in backend folder)
2. Check firewall isn't blocking port 3000
3. Verify the call ID in the URL is correct
4. Check backend logs for WebSocket errors

---

## Architecture

### WebSocket Flow

```
┌─────────────┐                 ┌─────────────┐                 ┌──────────────┐
│   Browser   │                 │   Backend   │                 │ AssemblyAI   │
│  (Frontend) │                 │   (Node.js) │                 │    API       │
└──────┬──────┘                 └──────┬──────┘                 └──────┬───────┘
       │                               │                                │
       │ 1. Connect WebSocket          │                                │
       │──────────────────────────────>│                                │
       │                               │ 2. Validate call              │
       │                               │                                │
       │                               │ 3. Connect to AssemblyAI      │
       │                               │───────────────────────────────>│
       │                               │                                │
       │ 4. Session start confirmed    │ 5. Session opened             │
       │<──────────────────────────────│<───────────────────────────────│
       │                               │                                │
       │ 6. Send PCM audio chunks      │                                │
       │──────────────────────────────>│ 7. Forward audio              │
       │                               │───────────────────────────────>│
       │                               │                                │
       │                               │ 8. Transcript (partial/final) │
       │ 9. Display transcript         │<───────────────────────────────│
       │<──────────────────────────────│                                │
       │                               │ 10. Store final in DB         │
       │                               │                                │
       │ 11. Stop listening            │                                │
       │──────────────────────────────>│ 12. Close AssemblyAI          │
       │                               │───────────────────────────────>│
```

### Data Flow

1. **Frontend** captures microphone audio using Web Audio API
2. **Frontend** converts Float32 → Int16 (PCM format)
3. **Frontend** sends PCM chunks via WebSocket to backend
4. **Backend** forwards audio to AssemblyAI streaming API
5. **AssemblyAI** returns partial and final transcripts
6. **Backend** sends transcripts to frontend + stores final in DB
7. **Frontend** displays transcripts in real-time

---

## Security Notes

✅ **API Key Protection:**
- AssemblyAI key stays in backend `.env` (never exposed to frontend)
- Frontend connects to backend WebSocket (not directly to AssemblyAI)
- No VITE_* environment variable exposes the key

✅ **Call Validation:**
- Backend validates call exists and is in_progress before allowing transcription
- Invalid call IDs are rejected with error message

✅ **Database Security:**
- `transcript_segments` table has RLS enabled
- Only backend service-role key can access (bypasses RLS)
- No public access policies defined

---

## Limitations & Future Enhancements

### Current Limitations

1. **Microphone only:** Captures salesperson audio, not prospect audio
2. **No speaker identification:** All transcripts marked as "salesperson"
3. **No telephone call recording:** Does not capture phone conversations
4. **English only:** Language detection not yet implemented
5. **No timing sync:** Start/end times not captured (AssemblyAI real-time limitation)
6. **No audio storage:** Audio is transcribed and discarded (not recorded)

### Future Enhancements

- [ ] Telephone call recording integration (requires telephony provider)
- [ ] Speaker diarization (who spoke when)
- [ ] Multi-language support (Telugu, Hindi, etc.)
- [ ] Translation (Telugu → English)
- [ ] Audio file upload and transcription
- [ ] Playback synchronized with transcript
- [ ] Edit/correct transcripts manually
- [ ] Export transcripts (PDF, DOCX)

---

## Cost Information

### AssemblyAI Pricing (as of 2024)

- **Free Tier:** 5 hours/month (100 hours one-time bonus for new accounts)
- **Pay-as-you-go:** $0.00025 per second = $0.015 per minute = $0.90 per hour
- **Real-time streaming:** Same pricing as async transcription

### Example Costs

| Call Duration | Cost (USD) |
|---------------|------------|
| 5 minutes     | $0.075     |
| 15 minutes    | $0.225     |
| 30 minutes    | $0.450     |
| 1 hour        | $0.900     |

**Recommendation:** Use the free tier for development/testing. Monitor usage in AssemblyAI dashboard.

---

## Next Steps

After verifying this module works:

1. ✅ Test microphone transcription with real calls
2. ⏳ Integrate transcripts with existing Gemini AI analysis
3. ⏳ Add "Analyze Transcript" button to send full transcript to Gemini
4. ⏳ Auto-detect stage transitions from transcript
5. ⏳ Add Telugu language support (Module 2)
6. ⏳ Implement visual AI aids (Module 3)

---

## Support & Debugging

**AssemblyAI Issues:**
- Docs: https://www.assemblyai.com/docs
- API Reference: https://www.assemblyai.com/docs/api-reference
- Status: https://status.assemblyai.com/

**Project Issues:**
- Check backend logs: Look for `[WebSocket]` and `[Speech]` messages
- Check frontend console: Look for `[AudioPanel]` messages
- Verify database: Query `transcript_segments` table in Supabase

**Common Debug Commands:**

```bash
# Check if assemblyai package is installed
cd backend && npm list assemblyai

# Test WebSocket server is running
curl -I http://localhost:3000/health

# Check database table exists
# In Supabase SQL Editor:
SELECT COUNT(*) FROM transcript_segments;

# View recent transcripts
SELECT * FROM transcript_segments ORDER BY created_at DESC LIMIT 10;
```

---

## Conclusion

This MVP demonstrates real-time speech-to-text transcription for microphone input. The architecture is secure (API key in backend only), the transcripts are persisted in the database, and the UI provides clear feedback about recording status.

**The next logical step is integrating these transcripts with the existing Gemini AI analysis to provide intelligent stage detection and response suggestions based on what the salesperson actually says.**

