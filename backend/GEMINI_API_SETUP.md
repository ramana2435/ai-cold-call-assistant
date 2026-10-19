# Gemini API Setup Guide

## Issue Identified

The current `GEMINI_API_KEY` in your `.env` file appears to be invalid:
- Current format: `AQ.Ab8RN6J...`
- Expected format: `AIzaSy...` (39 characters starting with "AIza")

## How to Get a Valid Gemini API Key

### Step 1: Visit Google AI Studio

Go to: **https://aistudio.google.com/app/apikey**

### Step 2: Sign in with Google Account

Use any Google account (personal or workspace).

### Step 3: Create API Key

1. Click **"Create API Key"** button
2. Select **"Create API key in new project"** (or select existing project)
3. Copy the generated key

**Important:** The key should look like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (39 characters)

### Step 4: Update Backend .env File

Edit `backend/.env`:

```env
# Gemini AI Configuration (for LLM features)
GEMINI_API_KEY=AIzaSyYourActualKeyHere
GEMINI_MODEL=gemini-1.5-flash
```

### Step 5: Test the Connection

```bash
cd backend
node test-gemini-connection.js
```

**Expected output:**
```
✅ SUCCESS! Gemini API responded:
"Hello, the connection works!"
```

## Supported Models (as of v0.24.1 SDK)

The following models support `generateContent`:

| Model Name | Description | Use Case |
|------------|-------------|----------|
| `gemini-1.5-flash` | Fast, efficient | Recommended for this app |
| `gemini-1.5-pro` | More capable | Better quality, slower |
| `gemini-pro` | Stable version | Fallback option |

## Troubleshooting

### Error: "API key not found"

**Cause:** Missing or invalid `GEMINI_API_KEY` in `.env`

**Fix:**
1. Ensure `.env` file exists in `backend/` directory
2. Check the key starts with `AIza`
3. Verify no extra spaces or quotes around the key

### Error: "Model not found for API version v1beta"

**Cause:** 
- Invalid model name
- API key doesn't have access to the model
- Using an older SDK version

**Fix:**
1. Try `gemini-1.5-flash` (recommended)
2. Or try `gemini-pro` (stable)
3. Verify your API key at: https://aistudio.google.com/app/apikey

### Error: "Quota exceeded"

**Cause:** Free tier limits reached

**Fix:**
1. Check usage: https://aistudio.google.com/app/apikey
2. Wait for daily quota reset (resets at midnight Pacific Time)
3. Or upgrade to paid tier

### Error: "Rate limit reached"

**Cause:** Too many requests in short time

**Fix:**
1. Wait 60 seconds
2. Reduce request frequency
3. Implement exponential backoff in production

### Error: "fetch failed" or Network Error

**Cause:** Network connectivity issues

**Fix:**
1. Check internet connection
2. Verify firewall/proxy settings
3. Try again in a few moments

## API Key Security

✅ **DO:**
- Keep API key in `backend/.env` only
- Add `.env` to `.gitignore`
- Never commit API keys to Git
- Use environment variables in production

❌ **DON'T:**
- Expose API key in frontend code
- Use `VITE_*` or `NEXT_PUBLIC_*` prefixes for Gemini keys
- Print API keys in logs
- Share API keys publicly

## Production Deployment

For Render deployment:

1. Go to Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add environment variable:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your actual API key (starting with `AIza`)
5. Save and deploy

## Testing All 4 LLM Endpoints

After fixing the API key, test all endpoints:

### 1. Analyze Transcript

```bash
curl -X POST http://localhost:3000/calls/YOUR_CALL_ID/analyze \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Hello, this is John from ClinicBooks calling about accounting software for your medical practice."}'
```

### 2. Suggest Next Stage

```bash
curl -X POST http://localhost:3000/calls/YOUR_CALL_ID/suggest-stage \
  -H "Content-Type: application/json" \
  -d '{"conversationSummary": "The prospect asked what we do and requested more info."}'
```

### 3. Suggest Response

```bash
curl -X POST http://localhost:3000/calls/YOUR_CALL_ID/suggest-response \
  -H "Content-Type: application/json" \
  -d '{"prospectLastWords": "We already have an accountant who handles everything."}'
```

### 4. Get Call Intelligence

```bash
curl http://localhost:3000/calls/YOUR_CALL_ID/intelligence
```

## References

- **Google AI Studio:** https://aistudio.google.com/
- **Gemini API Docs:** https://ai.google.dev/docs
- **Available Models:** https://ai.google.dev/models/gemini
- **Pricing:** https://ai.google.dev/pricing

---

**Last Updated:** October 18, 2026
