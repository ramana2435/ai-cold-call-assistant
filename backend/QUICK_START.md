# Quick Start Guide - AI Cold-Call Assistant Backend

## ✅ Status: Ready to Use

All issues resolved. Gemini API integration is fully operational.

---

## 1. Test Gemini Connection

```bash
cd backend
node test-gemini-connection.js
```

**Expected:** `✅ SUCCESS! Gemini API responded: "Connection successful"`

---

## 2. Build Backend

```bash
cd backend
npm run build
```

**Expected:** Compiles with zero errors

---

## 3. Run Backend Server

```bash
cd backend
npm start
```

**Expected:**
```
🚀 AI Cold-Call Assistant Backend
📡 Server running on port 3001
🌍 Environment: development
🔗 Health check: http://localhost:3001/health
```

---

## 4. Test API Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

### Analyze Stage
```bash
curl -X POST http://localhost:3001/api/calls/analyze-stage \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test-123",
    "transcript": "Hi, this is John from TechCorp. I wanted to reach out about your sales process."
  }'
```

### Recommend Stage
```bash
curl -X POST http://localhost:3001/api/calls/recommend-stage \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test-123",
    "currentStage": 2,
    "transcript": "We are actually looking to improve our sales automation."
  }'
```

### Suggest Response
```bash
curl -X POST http://localhost:3001/api/calls/suggest-response \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test-123",
    "currentStage": 4,
    "transcript": "Tell me more about what you offer."
  }'
```

### Get Call Intelligence
```bash
curl -X POST http://localhost:3001/api/calls/intelligence \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test-123",
    "transcript": "Interesting. We have been looking for something like this. When can we schedule a demo?"
  }'
```

---

## What Was Fixed

1. **Gemini Model:** Updated from deprecated `gemini-1.5-flash` to `gemini-3.5-flash`
2. **Windows Certificates:** Installed `win-ca` package to handle SSL certificate verification
3. **Stage 8 Persistence:** Fixed duplicate insertion bug with UPDATE-or-INSERT pattern

---

## Configuration Files

- `backend/.env` - Your API key and model configuration
- `backend/src/config/index.ts` - Configuration loading
- `backend/src/services/llmService.ts` - Gemini API integration
- `backend/src/services/callService.ts` - Stage persistence (fixed)

---

## Important Notes

### API Key Format
Your `GEMINI_API_KEY` starts with `AQ.` - this is the correct **Auth Key** format from Google AI Studio (valid since May 2026).

### Windows Certificate Fix
The backend automatically loads Windows certificates using `win-ca` package with fallback mode. This is **safe for production**.

### Model Name
Always use `gemini-3.5-flash` (not gemini-1.5-flash or gemini-2.0-flash which are deprecated).

---

## Troubleshooting

If connection fails:
1. Check `backend/.env` has valid `GEMINI_API_KEY`
2. Run `node diagnose-network.js` to check network/certificates
3. See `backend/WINDOWS_SETUP.md` for detailed certificate troubleshooting
4. See `backend/GEMINI_INTEGRATION_SUMMARY.md` for complete technical details

---

## Next Steps

1. ✅ Backend is ready
2. Connect your frontend to `http://localhost:3001`
3. Use the 4 LLM endpoints in your UI
4. Monitor calls and stage transitions in real-time

---

**Need Help?**
- Full technical details: `backend/GEMINI_INTEGRATION_SUMMARY.md`
- Windows setup: `backend/WINDOWS_SETUP.md`
- API reference: `API_QUICK_REFERENCE.md`
