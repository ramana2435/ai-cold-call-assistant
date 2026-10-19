# Test Guide: Intelligence Feature

## Quick Verification

Run these commands to verify the fix:

### 1. Verify Builds (Required)
```bash
# Backend
cd backend
npm run build

# Frontend  
cd frontend
npm run build
```
**Expected:** Both build without errors

---

## Full End-to-End Test

### Step 1: Start Backend Server
```bash
cd backend
npm start
```

**Expected Output:**
```
============================================================
🚀 AI Cold-Call Assistant Backend
============================================================
📡 Server running on port 3000
🌍 Environment: development
🔗 Health check: http://localhost:3000/health
============================================================
```

### Step 2: Test Intelligence Endpoint (Terminal)

In a **new terminal**, test with an existing call ID:

```bash
cd backend
node test-intelligence-endpoint.js <your-call-id>
```

**Example:**
```bash
node test-intelligence-endpoint.js 681f7931-e7d2-415b-a8a0-e80b4a4b4b7b
```

**Expected Success Output:**
```
============================================================
Testing Intelligence Endpoint
============================================================
API Base: http://localhost:3000
Call ID: 681f7931-e7d2-415b-a8a0-e80b4a4b4b7b
============================================================

⏳ Fetching call intelligence...

Response Status: 200 OK

✅ SUCCESS Response:
{
  "success": true,
  "data": {
    "callId": "681f7931-e7d2-415b-a8a0-e80b4a4b4b7b",
    "stageProgression": [...],
    "overallSentiment": "neutral",
    "criticalPhrases": [...],
    "recommendedActions": [...],
    "confidenceScore": 0.5
  },
  "message": "Call intelligence retrieved successfully"
}

------------------------------------------------------------
Validating Response Structure:
------------------------------------------------------------
✅ callId: string
✅ stageProgression: array
✅ overallSentiment: string
✅ criticalPhrases: array
✅ recommendedActions: array
✅ confidenceScore: number
------------------------------------------------------------

✅ All validations passed!
============================================================
```

**If call doesn't exist, create one first:**
```bash
curl -X POST http://localhost:3000/calls \
  -H "Content-Type: application/json" \
  -d '{
    "prospect_name": "John Smith",
    "company_name": "TechCorp"
  }'
```
This will return a call with an `id` field - use that ID for testing.

### Step 3: Test with curl (Alternative)

```bash
curl http://localhost:3000/calls/<call-id>/intelligence
```

**Expected:** JSON response with all required fields

### Step 4: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 5: Test in Browser

1. Open `http://localhost:5173` (or whatever Vite shows)
2. Navigate to a call detail page (click on any call)
3. Find the "AI Actions" panel on the right
4. Click "📊 Get Intelligence" button
5. **Verify:**
   - ✅ No console errors (open DevTools → Console)
   - ✅ Intelligence card appears below the button
   - ✅ Shows: Sentiment, Confidence, Critical Phrases, Actions
   - ✅ No "undefined" or blank values
   - ✅ Arrays display properly (even if empty)

### Step 6: Test Other AI Actions (Regression Test)

Ensure the other AI features still work:

#### Test "Analyze Transcript"
1. Click "🔍 Analyze Transcript"
2. Enter test transcript: "Hi, this is John from TechCorp. How are you today?"
3. **Expected:** Analysis card shows detected stage, confidence, sentiment

#### Test "Suggest Next Stage"  
1. Click "💡 Suggest Next Stage"
2. Optionally enter context, or just press OK
3. **Expected:** Recommendation card shows suggested stage and reasoning

#### Test "Suggest Response"
1. Click "💬 Suggest Response"
2. Enter prospect words: "Tell me more about your pricing"
3. **Expected:** Response suggestion card shows suggested reply

---

## Troubleshooting

### Backend Returns 404
**Problem:** Call ID doesn't exist

**Solution:** Create a call first:
```bash
curl -X POST http://localhost:3000/calls \
  -H "Content-Type: application/json" \
  -d '{"prospect_name":"Test","company_name":"TestCo"}'
```

### Backend Returns 500
**Check backend terminal for error logs:**
- `[Intelligence] Error generating intelligence...`
- Look for database connection errors
- Verify Supabase credentials in `.env`

**Quick fix:** Check backend console output for detailed error

### Frontend Shows Error Message
**Check browser DevTools console for:**
- Network errors (404, 500)
- CORS errors
- API connection refused

**Solutions:**
- Ensure backend is running on port 3000
- Check `frontend/.env` has `VITE_API_BASE_URL=http://localhost:3000`
- Verify CORS is enabled in backend

### Frontend Crashes / Blank Screen
**Most likely:** Old issue (already fixed)

**Verify:**
- Check browser console for "Cannot read properties of undefined"
- If present, ensure you pulled latest changes
- Rebuild frontend: `npm run build`

### Empty Intelligence Data
**Normal if:**
- Call has no stage results yet
- No conversation history recorded

**Expected behavior:**
- Shows basic intelligence
- `criticalPhrases: []` (empty array, not undefined)
- `recommendedActions: ["Start the conversation"]`

---

## Test Matrix

| Test Case | Expected Result |
|-----------|----------------|
| Valid call with stages | Returns full intelligence |
| Valid call, no stages | Returns basic intelligence |
| Invalid call ID format | 400 validation error |
| Non-existent call ID | 404 not found |
| Frontend displays data | No errors, card renders |
| Empty arrays | Renders safely, no crash |
| Other AI actions | Still work correctly |

---

## Backend Logs to Watch For

### Success
```
[Intelligence] Successfully generated intelligence for call <id>
```

### No Conversation  
```
[Intelligence] No conversation history for call <id>, returning basic intelligence
```

### Errors
```
[Intelligence] Failed to parse Gemini response: <error>
[Intelligence] Raw response: <gemini output>
[Intelligence] Error generating intelligence for call <id>: <error>
```

---

## Frontend Console to Watch For

### Success
- No errors
- Network tab shows: `GET /calls/<id>/intelligence` → 200 OK

### Errors (Fixed)
- ~~`TypeError: Cannot read properties of undefined (reading 'join')`~~ ✅ Fixed
- ~~`intelligence.criticalPhrases is undefined`~~ ✅ Fixed

### Current (Safe)
- May see: `intelligence.criticalPhrases.length === 0` (normal for new calls)

---

## Verification Checklist

- [ ] Backend builds without TypeScript errors
- [ ] Frontend builds without TypeScript errors  
- [ ] Backend server starts successfully
- [ ] GET endpoint returns 200 for valid call
- [ ] Response has all required fields (callId, stageProgression, etc.)
- [ ] Frontend button triggers request
- [ ] Intelligence card displays
- [ ] No console errors in browser
- [ ] Empty arrays don't cause crash
- [ ] Other AI actions still work
- [ ] Can test with multiple calls

---

## Quick Command Reference

```bash
# Build both
cd backend && npm run build && cd ../frontend && npm run build

# Start backend
cd backend && npm start

# Test endpoint (new terminal)
cd backend && node test-intelligence-endpoint.js <call-id>

# Start frontend (new terminal)
cd frontend && npm run dev

# Create test call
curl -X POST http://localhost:3000/calls \
  -H "Content-Type: application/json" \
  -d '{"prospect_name":"Test User","company_name":"Test Corp"}'

# Get intelligence
curl http://localhost:3000/calls/<call-id>/intelligence
```

---

**Status:** Ready for testing
**Fix Date:** October 18, 2026
