# AssemblyAI v3 Streaming - Testing Checklist

## Pre-Test Setup

### 1. Verify Environment Configuration
- [ ] `backend/.env` exists and contains valid `ASSEMBLYAI_API_KEY`
- [ ] AssemblyAI account has available credits
- [ ] No firewall blocking `streaming.assemblyai.com:443`

### 2. Database Migration
- [ ] Migration `database/migrations/002_transcript_segments.sql` applied in Supabase
- [ ] Table `transcript_segments` exists with correct schema

### 3. Backend Build
- [x] TypeScript compilation successful (`npm run build` exit code 0)
- [ ] No TypeScript errors or warnings

## Testing Steps

### Phase 1: Backend Startup
```bash
cd backend
npm run dev
# or
npm start
```

**Expected Output:**
```
Server running on port 3000
[WebSocket] Server initialized
```

**Checklist:**
- [ ] Server starts without errors
- [ ] Port 3000 (or configured PORT) is accessible
- [ ] No "ASSEMBLYAI_API_KEY not configured" warnings

### Phase 2: Browser Connection
1. Open frontend application in browser
2. Navigate to call interface
3. Create or select a call
4. Click "Start Listening"

**Expected Backend Logs:**
```
[WebSocket] New connection: /ws/calls/<callId>/transcribe
[WebSocket] Origin: <frontend-origin>
[WebSocket] Call ID extracted: <callId>
[WebSocket] Validating call <callId>...
[WebSocket] Call validation result: true
[WebSocket] Creating AssemblyAI client for call <callId>...
[WebSocket] Creating streaming transcriber for call <callId>...
[WebSocket] Streaming transcriber created for call <callId>
[WebSocket] Attempting to connect to AssemblyAI v3 streaming for call <callId>...
[WebSocket] Connection config: sampleRate=16000, encoding=pcm_s16le, speechModel=universal-3-6, timeout=10000ms
```

**Checklist:**
- [ ] Browser WebSocket connects successfully
- [ ] Call validation passes
- [ ] AssemblyAI client created without errors
- [ ] Connection attempt started

### Phase 3: AssemblyAI Connection (CRITICAL)

**SUCCESS Case - Expected Logs:**
```
[WebSocket] ✅ Connected to AssemblyAI v3 streaming for call <callId>
[WebSocket] Session ID: <session-id>, expires: <ISO-timestamp>
[WebSocket] AssemblyAI session opened: <session-id> for call <callId>
[WebSocket] Session expires at: <ISO-timestamp>
```

**FAILURE Case - Diagnostic Logs:**
```
[WebSocket] ❌ AssemblyAI connection failed for call <callId>
[WebSocket] Error type: <error-type>
[WebSocket] Error message: <detailed-message>
[WebSocket] Error cause: <cause-details>
[WebSocket] Error stack: <stack-trace>
```

**Checklist:**
- [ ] ✅ appears in logs (connection successful)
- [ ] Session ID received
- [ ] Expiry timestamp is in the future
- [ ] No timeout errors after 10 seconds
- [ ] `session_start` message sent to frontend

**If connection fails**, check:
- [ ] API key is correct in `.env`
- [ ] AssemblyAI account has credits
- [ ] Network connectivity to `streaming.assemblyai.com`
- [ ] No firewall/proxy blocking WebSocket connections
- [ ] Error message indicates auth vs network vs timeout

### Phase 4: Audio Streaming

**Test Sentence:** "Hello this is a test"

Speak clearly into microphone after clicking "Start Listening"

**Expected Backend Logs (Partial Transcripts):**
```
[WebSocket] Turn #1 (partial): Hello
[WebSocket] Turn #1 (partial): Hello this
[WebSocket] Turn #1 (partial): Hello this is
[WebSocket] Turn #1 (partial): Hello this is a
[WebSocket] Turn #1 (partial): Hello this is a test
```

**Expected Backend Logs (Final Transcript):**
```
[WebSocket] Turn #1 (final): Hello this is a test
[WebSocket] Stored final transcript for call <callId>
```

**Checklist:**
- [ ] Partial transcripts appear during speech
- [ ] Turn number increments correctly
- [ ] `(partial)` and `(final)` labels are correct
- [ ] Final transcript stored in database
- [ ] Transcript text matches spoken words
- [ ] No audio processing errors

### Phase 5: Database Persistence

Query Supabase `transcript_segments` table:
```sql
SELECT * FROM transcript_segments 
WHERE call_id = '<callId>' 
ORDER BY created_at DESC;
```

**Expected Result:**
- [ ] Row exists for the call
- [ ] `text` column contains "Hello this is a test"
- [ ] `is_final` = true
- [ ] `confidence` has a numeric value
- [ ] `created_at` timestamp is recent

### Phase 6: Frontend Display

**Expected Frontend Behavior:**
- [ ] "Start Listening" button changes to "Stop Listening"
- [ ] Partial transcripts appear in real-time
- [ ] Final transcripts persist in UI
- [ ] No JavaScript errors in browser console
- [ ] WebSocket connection shows as "connected"

### Phase 7: Multiple Turns

**Test Multiple Sentences:**
1. "Hello this is a test"
2. (pause 2 seconds)
3. "This is the second sentence"
4. (pause 2 seconds)
5. "And here is the third"

**Expected Backend Logs:**
```
[WebSocket] Turn #1 (final): Hello this is a test
[WebSocket] Stored final transcript for call <callId>
[WebSocket] Turn #2 (final): This is the second sentence
[WebSocket] Stored final transcript for call <callId>
[WebSocket] Turn #3 (final): And here is the third
[WebSocket] Stored final transcript for call <callId>
```

**Checklist:**
- [ ] Each sentence gets its own turn number
- [ ] All final transcripts stored in database
- [ ] No transcript mixing between turns
- [ ] Pauses correctly trigger turn boundaries

### Phase 8: Error Handling

**Test 1: Stop/Restart**
1. Click "Stop Listening"
2. Wait 2 seconds
3. Click "Start Listening" again

**Expected:**
- [ ] Old session closes gracefully
- [ ] New session connects successfully
- [ ] No lingering connections

**Test 2: Network Disconnect**
1. Disable Wi-Fi during transcription
2. Re-enable Wi-Fi

**Expected:**
- [ ] Error handler logs disconnect
- [ ] Frontend shows error state
- [ ] Reconnect button available

**Test 3: Invalid Call**
1. Attempt to connect with non-existent callId

**Expected:**
```
[WebSocket] Invalid call or call not in progress: <fake-id>
[WebSocket] Client error: Invalid call
```
- [ ] Connection rejected with 1008 code
- [ ] Error message sent to frontend

## Success Criteria

✅ **Connection Success:** AssemblyAI session opens within 10 seconds  
✅ **Transcription Works:** Spoken words appear as text  
✅ **Database Persistence:** Final transcripts stored correctly  
✅ **Frontend Display:** Real-time updates visible  
✅ **Multiple Turns:** Separate sentences get separate turn numbers  
✅ **Error Handling:** Graceful degradation on failures

## Configuration Summary

| Parameter | Value | Why |
|-----------|-------|-----|
| `sampleRate` | 16000 | Standard rate for voice |
| `encoding` | pcm_s16le | Raw PCM 16-bit signed little-endian |
| `speechModel` | universal-3-6 | Latest stable streaming model |
| `connectTimeout` | 10000ms | Windows networking + TLS handshake |
| `maxConnectionRetries` | 2 | Up to 3 total attempts |
| `connectionRetryDelay` | 500ms | Wait between retries |

## Troubleshooting Guide

### Timeout after 10 seconds
**Cause:** Network/firewall/DNS/auth issue  
**Action:** Check error logs for specific cause, verify API key, test network connectivity

### Connection succeeds but no transcripts
**Cause:** Audio not reaching AssemblyAI  
**Action:** Check browser microphone permissions, verify audio format, check frontend audio capture

### Partial transcripts only
**Cause:** Turn boundary not detected  
**Action:** Speak for longer, pause between sentences, check VAD settings

### Database errors
**Cause:** Migration not applied or schema mismatch  
**Action:** Apply `002_transcript_segments.sql`, verify table schema

### Frontend not updating
**Cause:** WebSocket message handling issue  
**Action:** Check browser console, verify message format, check frontend WebSocket code

## Files Modified
- `backend/src/services/websocketHandler.ts` - Timeout, model, logging
- `ASSEMBLYAI_V3_MIGRATION.md` - Migration documentation
- `TIMEOUT_DIAGNOSTIC.md` - Diagnostic details
- `TESTING_CHECKLIST.md` - This file
