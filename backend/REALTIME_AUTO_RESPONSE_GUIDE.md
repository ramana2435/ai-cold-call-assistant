# Real-Time Auto-Response Guide

## Overview

The AI Cold-Call Assistant features **real-time automatic response generation** that continuously monitors live transcripts from AssemblyAI WebSocket streaming and auto-generates context-aware response suggestions when the **prospect** speaks (finalized utterances only).

This feature provides **hands-free** response suggestions during active calls, helping salespeople respond quickly and effectively without manually clicking "Suggest Response."

## How It Works

### Trigger Conditions
Auto-response generation triggers **only** when:
1. **Speaker is identified as "prospect"** (not salesperson)
2. **Utterance is finalized** (not interim/partial transcripts)
3. **Turn order is new** (not already processed - prevents duplicates)
4. **Transcript has content** (not empty or whitespace-only)

### Processing Flow
1. **WebSocket Receives Final Prospect Turn**
   - AssemblyAI sends finalized transcript with speaker label
   - Speaker identification determines role (salesperson/prospect)

2. **Auto-Response Trigger**
   - `autoResponseService.processAutoResponseTrigger()` called
   - Checks: isFinal=true, speaker='prospect', new turnOrder

3. **Debouncing (500ms)**
   - Waits 500ms after finalized turn before processing
   - If another finalized turn arrives within 500ms, previous request is cancelled
   - Only processes the **latest** utterance

4. **Stale Request Cancellation**
   - When newer prospect utterance arrives, in-progress AI request is aborted
   - Prevents wasted API calls and stale responses

5. **AI Generation**
   - Calls `llmService.suggestResponseWithReferences()`
   - Uses current conversation context, stage, product/organization knowledge
   - Returns primary response + alternatives + reference intelligence

6. **WebSocket Response**
   - Success: Sends `{type: 'auto_response', response: {...}, contextSource: ...}` to frontend
   - Error: Sends `{type: 'auto_response_error', message: ...}` to frontend
   - **Transcription NEVER stops on AI errors**

## Performance Characteristics

### Latency
- **Debounce delay**: 500ms (from finalized turn to AI request start)
- **AI response time**: 500-3000ms (depends on provider - see DUAL_PROVIDER_GUIDE.md)
  - Groq (text tasks): ~500-1500ms
  - Gemini (fallback): ~1000-3000ms
- **Total typical latency**: ~1-4 seconds from prospect finishing speaking to suggestion appearing

### Rate Limits
- **Per-call state tracking**: Each call has independent debouncing and duplicate prevention
- **No artificial rate limiting**: Relies on AI provider rate limits (see DUAL_PROVIDER_GUIDE.md)
- **Duplicate prevention**: Same turnOrder never triggers generation twice

### Resource Usage
- **In-memory state**: Lightweight Map per call (lastProcessedTurnOrder, inProgressRequest, pendingUtterance)
- **State cleanup**: Automatically cleared when call closes or client disconnects

## Error Handling

### Graceful Degradation
- **AI failures do NOT interrupt transcription**
- **WebSocket stays open** even if auto-response fails
- **Transcript updates continue** regardless of AI availability

### Error Types & Responses

#### AI Provider Errors
- **Rate limit (429)**: Logs error, sends `auto_response_error` to frontend, **fallback to alternate provider** (if configured)
- **Service unavailable (503)**: Same as above
- **Network errors**: Logs error, returns null, sends error message to frontend
- **Timeout**: Cancels request, logs timeout, sends error message

#### Non-Retryable Errors
- **Authentication (401)**: Logs error, sends error message, does not retry
- **Invalid model (404)**: Logs error, sends error message
- **Parse errors**: Logs error (response format issue), sends generic error message

### Error Messages to Frontend
```json
{
  "type": "auto_response_error",
  "message": "Failed to generate auto-response. You can manually request a suggestion."
}
```

Frontend displays non-blocking error banner and allows manual retry.

### Logging
- **Success**: `[Auto-Response] Generated response for call {callId}, turn {turnOrder}`
- **Skipped**: `[Auto-Response] skipped/cancelled for call {callId}, turn {turnOrder}`
- **Error**: `[Auto-Response] Error generating response for call {callId}: {error.message}` (does NOT log full transcript or API keys)

## Safety Features

### 1. Duplicate Prevention
- Tracks `lastProcessedTurnOrder` per call
- Ignores turnOrder <= lastProcessedTurnOrder
- Prevents double-generation if frontend reconnects or WebSocket re-sends

### 2. Stale Request Cancellation
- When newer prospect utterance arrives during AI generation, **cancels** in-progress request
- Uses AbortController to terminate HTTP/network requests
- Logs: `[Auto-Response] Cancelled stale request for call {callId}`

### 3. Debouncing
- 500ms delay before processing finalized turn
- If multiple finalized turns arrive rapidly (e.g., short phrases), only processes **last** one
- Reduces unnecessary API calls

### 4. Never Auto-Speak or Auto-Send
- **Suggestions are display-only**
- User must **manually copy and speak** the suggested response
- No automated voice synthesis or message sending

### 5. Transcription Priority
- **Transcription always continues**, even if auto-response fails
- AI errors logged but do NOT close WebSocket or stop microphone capture
- Transcript storage to database happens **before** auto-response trigger (critical path first)

### 6. Limited Context Warning
- If no transcript context available yet (call just started), frontend shows warning banner:
  - `"⚠️ Limited context available. Response may be generic until more conversation history is captured."`
- `contextSource` field in response indicates data quality:
  - `'prospectWords'`: High quality (based on specific prospect utterance)
  - `'transcript'`: Good quality (based on recent conversation)
  - `'limited'`: Low quality (little/no context)

## Frontend Integration

### AudioPanel.tsx
- Receives `auto_response` and `auto_response_error` WebSocket messages
- Stores `latestAutoResponse` state: `{primary, alternatives, turnOrder, timestamp, referenceIntelligence, contextSource}`
- Sets `processingAutoResponse=true` when prospect finalizes turn
- Passes state up to CallWorkspace via callbacks

### AutoResponsePanel.tsx
- Displays suggested response with:
  - **Status badge**: Listening | Processing | Ready | Unavailable
  - **Primary response** + explanation
  - **Up to 2 alternatives** (collapsible)
  - **Reference intelligence** snippet (if available)
  - **Copy button** (clipboard integration)
  - **Manual retry button** (calls existing `/suggest-response-with-references` API)
  - **Last updated timestamp**
- **Empty state**: "Waiting for prospect to speak..."
- **Limited context warning** (yellow banner when contextSource='limited')

### CallWorkspace.tsx
- Integrates AutoResponsePanel in right sidebar
- Order: VisualAssistancePanel → **AutoResponsePanel** → AudioPanel
- Shows **only on active calls** (not closed)
- Green theme (bg-green-50) to distinguish from manual AI actions (blue)

## Manual Retry Option

If auto-response fails or user wants fresh suggestion:
1. Click **"Retry Suggestion"** button in AutoResponsePanel
2. Frontend calls existing API: `POST /calls/:id/suggest-response-with-references`
3. Uses current transcript context from AudioPanel
4. Updates `latestAutoResponse` on success

This is the **same API** used by manual "Suggest Response" button in AIActionsPanel, ensuring consistent behavior.

## Configuration

### Disabling Auto-Response (Future)
Currently auto-response is always enabled for active calls. To disable in a future version, add environment variable:
```env
AUTO_RESPONSE_ENABLED=false
```

### Adjusting Debounce Delay (Future)
Currently hardcoded to 500ms. To make configurable:
```env
AUTO_RESPONSE_DEBOUNCE_MS=500
```

### Provider Configuration
Auto-response uses the same AI provider configuration as other features (see DUAL_PROVIDER_GUIDE.md):
- Text-based response suggestions use **Groq** (if configured) or **Gemini**
- Fallback to alternate provider on rate limits/timeouts
- Respects `AI_PROVIDER` and `AI_FALLBACK_ENABLED` settings

## Testing & Verification

### Unit Tests
Run: `npm test -- autoResponseService.test.ts`

Tests cover:
- Filtering (finalized-only, prospect-only, new turnOrder)
- Debouncing (rapid turns trigger only one response)
- Stale request cancellation (newer utterance cancels in-flight request)
- Duplicate prevention (same turnOrder never triggers twice)
- Error handling (AI failures return null, not throw)

### Integration Testing
1. **Start backend**: `npm run dev` (port 3000)
2. **Start frontend**: `npm run dev` (port 5173)
3. **Create call** with product/organization profiles
4. **Navigate to call workspace**, verify AutoResponsePanel visible (status: Listening)
5. **Click "Start Listening"** in AudioPanel
6. **Speak as salesperson** (e.g., "Hello, I am calling from XYZ Corp")
   - Verify speaker labeled 'salesperson'
   - No auto-response triggered
7. **Speak as prospect** (different voice/tone: "What is this about?")
   - Verify speaker labeled 'prospect'
   - AutoResponsePanel status changes: Listening → Processing → Ready
   - Suggested response appears
8. **Click copy button**, verify response copied to clipboard
9. **Speak another prospect utterance**, verify new response generated (old replaced)
10. **Check console logs**: No errors, transcription never interrupted
11. **Test error resilience**: Temporarily disconnect internet, speak as prospect
    - Verify error message in AutoResponsePanel
    - Verify transcription continues

### Observing Logs
Backend logs show real-time activity:
```
[WebSocket] Turn #3 (final) Speaker: prospect: What does your product do?
[Auto-Response] Generated response for call abc-123, turn 3
[WebSocket] Auto-response generated for call abc-123, turn #3
```

If errors occur:
```
[Auto-Response] Error generating response for call abc-123: Network timeout
[WebSocket] Auto-response error for call abc-123: Network timeout
```

## Architecture Decisions

### Why 500ms Debounce?
- Balances responsiveness vs. API efficiency
- Typical human speech cadence: ~150 words/minute = ~400ms/word
- Allows capturing short prospect phrases (2-3 words) without premature trigger
- If prospect pauses mid-sentence, doesn't waste API call on incomplete thought

### Why Only Prospect Utterances?
- Salesperson knows what they're saying (doesn't need suggestions for their own words)
- Reduces API calls by 50% (assuming balanced conversation)
- Focuses AI resources on the critical decision point: responding to prospect

### Why In-Memory State?
- Auto-response is **ephemeral** (user doesn't need historical auto-responses)
- Fast access (no database round-trip)
- Automatic cleanup on call end (no database cleanup needed)
- State is simple (lastProcessedTurnOrder, inProgressRequest, pendingUtterance)

### Why No Retry on Auto-Response Failure?
- Retries handled by underlying `aiProviderService` (max 3 attempts, exponential backoff)
- Auto-response is non-critical (user can manually retry if needed)
- Avoids cascading delays that disrupt real-time feel

## Troubleshooting

### "Auto-response not triggering"
- Check speaker identification: is prospect utterance labeled 'prospect'?
- Check finalized status: is turn marked `is_final=true`?
- Check logs: `[Auto-Response] skipped/cancelled` indicates filtering or debouncing
- Verify AI provider configured: GEMINI_API_KEY or GROQ_API_KEY in .env

### "Auto-response too slow"
- Check AI provider latency in logs
- If using Gemini only, configure Groq for faster text responses (see DUAL_PROVIDER_GUIDE.md)
- Check network latency to AI provider APIs

### "Frequent auto_response_error messages"
- Check AI provider rate limits (see DUAL_PROVIDER_GUIDE.md)
- Enable fallback: `AI_FALLBACK_ENABLED=true`
- Verify API keys valid and not expired
- Check backend logs for specific error messages

### "Duplicate responses for same utterance"
- Should not happen (duplicate prevention in place)
- Check logs for `already persisted` or `already processed` messages
- May indicate WebSocket reconnection - verify stable connection

### "Transcription stopped after AI error"
- Should not happen (auto-response errors never stop transcription)
- If transcription stops, error is in WebSocket/AssemblyAI layer, not auto-response
- Check backend logs for `[WebSocket]` errors

## Future Enhancements

### Planned
- [ ] Configurable enable/disable per call or globally
- [ ] Adjustable debounce delay
- [ ] Analytics: track auto-response usage, acceptance rate (when user copies suggested text)
- [ ] "Auto-response history" panel showing last 5 suggestions for current call

### Under Consideration
- [ ] Voice tone analysis: adjust suggestion formality based on prospect tone
- [ ] Sentiment-aware responses: adapt to prospect's emotional state
- [ ] Multi-turn context: consider prospect's last 2-3 utterances, not just latest
- [ ] Personalization: learn user's preferred response style over time

## Summary

- **Auto-response** provides hands-free, real-time suggestions during live calls
- **Triggers only on finalized prospect utterances** (not interim, not salesperson)
- **Debounces 500ms** to avoid premature triggers on incomplete thoughts
- **Cancels stale requests** when newer utterance arrives
- **Never interrupts transcription** - AI errors are logged and reported, but WebSocket stays open
- **Display-only** - no auto-speak or auto-send, user must manually copy and use suggestions
- **Manual retry available** via button in AutoResponsePanel
- **Integrates with dual AI provider system** (Groq + Gemini) for performance and reliability
