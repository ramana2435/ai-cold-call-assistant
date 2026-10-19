# Dual AI Provider Guide: Groq + Gemini

## Overview

The AI Cold-Call Assistant supports **dual AI providers**: **Groq** (for fast text-based tasks) and **Gemini** (for multimodal tasks and fallback). This architecture provides:

- **Performance**: Groq delivers faster response times for text-only tasks
- **Reliability**: Automatic fallback when one provider fails or hits rate limits
- **Flexibility**: Configure provider behavior via environment variables

## Why Dual Providers?

### Groq (llama-3.3-70b-versatile)
- **Speed**: Optimized inference, typically 500-1500ms response time
- **Best for**: Transcript analysis, response suggestions, stage recommendations, call intelligence
- **Limitation**: Text-only (no image/multimodal support)

### Gemini (gemini-3.5-flash)
- **Capabilities**: Supports text and multimodal (vision) tasks
- **Best for**: Visual context analysis, complex reasoning
- **Latency**: Typically 1000-3000ms response time
- **Reliability**: Google's infrastructure, strong rate limits

## Obtaining API Keys

### Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza` or `AQ.`)
5. Add to `backend/.env`:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Groq API Key (Optional)
1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign up or sign in
3. Navigate to **API Keys**
4. Click **"Create API Key"**
5. Copy the key
6. Add to `backend/.env`:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

**Note**: Groq is optional. If not configured, the system will use Gemini for all tasks.

## Configuration

### Environment Variables

#### `AI_PROVIDER` (default: `auto`)
Controls which provider handles which tasks.

- **`auto`** (recommended): Automatically routes tasks to the best provider
  - Text tasks (transcript analysis, response suggestions, etc.) → Groq (if available) or Gemini
  - Visual tasks → Gemini (required for multimodal)
  
- **`gemini`**: Use Gemini for all tasks (ignores Groq even if configured)
  
- **`groq`**: Prefer Groq for all text tasks, fall back to Gemini for visual tasks

#### `AI_FALLBACK_ENABLED` (default: `true`)
Controls whether the system tries an alternate provider when the primary fails.

- **`true`** (recommended): On rate limit (429), service unavailable (503), or timeout, automatically try the other provider
  
- **`false`**: Return error immediately without trying alternate provider

### Example Configurations

#### Dual-Provider Mode (Recommended)
```env
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
AI_PROVIDER=auto
AI_FALLBACK_ENABLED=true
```
**Behavior**: Groq handles text tasks, Gemini handles visual tasks. On failure, falls back to alternate provider.

#### Gemini-Only Mode
```env
GEMINI_API_KEY=AIza...
GROQ_API_KEY=
AI_PROVIDER=gemini
AI_FALLBACK_ENABLED=true
```
**Behavior**: All tasks use Gemini. Fallback disabled (no alternate provider).

#### Groq-Preferred Mode
```env
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
AI_PROVIDER=groq
AI_FALLBACK_ENABLED=true
```
**Behavior**: Groq handles all text tasks, Gemini handles visual tasks. Falls back on failure.

## Task Routing

When `AI_PROVIDER=auto` (default), tasks are routed as follows:

| Task Type | Auto Mode Default | Reasoning |
|-----------|------------------|-----------|
| `transcript-analysis` | Groq | Faster for pure text analysis |
| `response-suggestion` | Groq | Real-time suggestions benefit from speed |
| `stage-suggestion` | Groq | Simple classification task |
| `intelligence` | Groq | Conversation summarization |
| `visual-context` | Gemini | **Requires multimodal** (image understanding) |

## Fallback Behavior

When `AI_FALLBACK_ENABLED=true`:

1. **Primary provider** is attempted with bounded retry (max 3 attempts, exponential backoff: 1s, 2s, 4s)
2. **Fallback triggers** on:
   - `429 Rate Limit Exceeded`
   - `503 Service Unavailable`
   - Network timeout (`ETIMEDOUT`)
3. **Fallback behavior**: Single attempt on alternate provider (no retry on fallback)
4. **Both fail**: Error message includes both provider names and error details

### Non-Retryable Errors
These errors **do not trigger fallback** (user action required):
- `401 Authentication Failed` → Check API key
- `404 Model Not Found` → Check model name in config
- `403 Permission Denied` → Check API key permissions
- JSON parse errors → Check prompt formatting

## Error Messages & Troubleshooting

### "Authentication failed. Verify GEMINI_API_KEY..."
**Cause**: Invalid or expired Gemini API key.  
**Fix**: Verify key in `backend/.env`, check it starts with `AIza` or `AQ.`, regenerate if needed at [AI Studio](https://aistudio.google.com/app/apikey).

### "Groq authentication failed. Verify GROQ_API_KEY..."
**Cause**: Invalid Groq API key.  
**Fix**: Check key in `backend/.env`, verify it starts with `gsk_`, regenerate at [Groq Console](https://console.groq.com/keys).

### "Gemini API quota exceeded or rate limit reached..."
**Cause**: Hit Gemini free tier limits (15 RPM, 1500 RPD) or paid tier quota.  
**Fix**: Wait 1 minute or enable fallback to Groq. Upgrade to paid tier for higher limits.

### "Groq API rate limit reached..."
**Cause**: Hit Groq rate limits (varies by tier).  
**Fix**: Enable fallback to Gemini or wait. Check your [Groq usage dashboard](https://console.groq.com/usage).

### "AI request failed. Primary (groq): Rate limit. Fallback (gemini): Quota exceeded."
**Cause**: Both providers are unavailable (rate limits or quotas).  
**Fix**: Wait for rate limits to reset. Consider upgrading API tiers or reducing request frequency.

### "Network error: Connection refused..."
**Cause**: No internet connection or firewall blocking API requests.  
**Fix**: Check internet connection, verify firewall/antivirus settings allow outbound HTTPS to `generativelanguage.googleapis.com` and `api.groq.com`.

### "Prompt too long for Groq model"
**Cause**: Transcript or context exceeds Groq's context window (~8K tokens for llama-3.3-70b-versatile).  
**Fix**: System will automatically fall back to Gemini (larger context window). If both fail, reduce conversation history or transcript length.

### "Model 'gemini-3.5-flash' not available..."
**Cause**: Model name changed or deprecated.  
**Fix**: Check `GEMINI_MODEL` in `backend/.env`, verify current model names at [Google AI Studio](https://aistudio.google.com/app/models).

## Performance Characteristics

### Typical Response Times
- **Groq**: 500-1500ms (optimized for speed)
- **Gemini**: 1000-3000ms (depends on prompt complexity and length)

### Rate Limits (Free Tier)
- **Gemini**: 15 requests/minute, 1500 requests/day ([details](https://ai.google.dev/pricing))
- **Groq**: Varies by plan; free tier typically 30 RPM ([details](https://console.groq.com/settings/limits))

### Retry & Backoff
- **Max retry attempts**: 3 per provider
- **Backoff delays**: 1s, 2s, 4s (+ 0-100ms jitter to prevent thundering herd)
- **Timeout**: 30 seconds per request

## Windows Certificate Handling

The system uses **native Node.js `https` module** for Gemini API calls instead of the official SDK. This avoids Windows certificate verification issues that can occur with third-party HTTP libraries.

**If you see certificate warnings in logs**, the request will still succeed due to proper Windows certificate store integration.

## Testing & Verification

### Check Configuration
```bash
cd backend
npm run dev
```
Look for startup logs:
- `[Config] Warning: GROQ_API_KEY not configured. Dual-provider support disabled.` (Gemini-only mode)
- No warning → Dual-provider mode active

### Test Groq
1. Ensure `GROQ_API_KEY` is set
2. Create a call, click **"Suggest Response"** in AI Actions
3. Check backend logs for: `[AI Provider] groq succeeded...`

### Test Gemini
1. Create a call, click **"Analyze Visual Context"** in Visual Assistance Panel
2. Check logs for: `[AI Provider]` messages mentioning `gemini`

### Test Fallback
1. Temporarily set an invalid `GROQ_API_KEY`
2. Click **"Suggest Response"**
3. Check logs for: `Primary provider groq failed, falling back to gemini`
4. Response should still succeed via Gemini

## Disabling Groq (Gemini-Only Mode)

To revert to Gemini-only (original behavior):

1. Remove or comment out `GROQ_API_KEY` in `backend/.env`:
   ```env
   # GROQ_API_KEY=
   ```
2. Or set `AI_PROVIDER=gemini`:
   ```env
   AI_PROVIDER=gemini
   ```
3. Restart backend: `npm run dev`

The system will log: `[Config] Warning: GROQ_API_KEY not configured...` and use Gemini for all tasks.

## Support

- **Gemini API**: [Google AI Studio Support](https://aistudio.google.com/support)
- **Groq API**: [Groq Documentation](https://console.groq.com/docs)
- **Project Issues**: Check `backend/logs` for detailed error messages

## Summary

- **Dual providers** improve performance (Groq speed) and reliability (fallback)
- **Auto mode** (default) routes tasks intelligently
- **Fallback** (default enabled) provides resilience against rate limits
- **Gemini-only mode** works if Groq not configured (backward compatible)
- **Native HTTPS** for Windows certificate compatibility
