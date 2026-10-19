# AssemblyAI Streaming Timeout Diagnostic

## Problem
Connection attempts to AssemblyAI v3 streaming endpoint fail with:
```
Streaming connection timed out after 1000ms
```
SDK retries twice, then reports `retryable: true`.

## Root Cause Analysis

### 1. **Default Timeout Too Short**
- SDK default `connectTimeout`: **1000ms** (1 second)
- This includes:
  - TCP connection to `wss://streaming.assemblyai.com/v3/ws`
  - TLS handshake
  - WebSocket upgrade
  - Server's "Begin" handshake message
- Windows networking stack may need more time for:
  - DNS resolution
  - TLS certificate chain validation
  - Initial connection setup

### 2. **No Explicit Speech Model**
- Configuration didn't specify `speechModel`
- While SDK should default to a valid model, explicit configuration is clearer
- Valid streaming models from SDK v4.41.5:
  - `universal-3-6` (latest stable)
  - `universal-3-6-pro`
  - `universal-3-5-pro`
  - `u3-pro`
  - Others: `universal-streaming-english`, `universal-streaming-multilingual`

### 3. **Insufficient Error Details**
- Basic error logging didn't capture:
  - Error cause chain
  - Stack traces
  - Connection parameters at failure time

## Changes Applied

### websocketHandler.ts

#### 1. Transcriber Configuration (lines ~75-82)
```typescript
const st = client.streaming.transcriber({
  sampleRate: 16000,
  encoding: 'pcm_s16le',
  speechModel: 'universal-3-6', // Explicit latest stable model
  connectTimeout: 10000, // 10 seconds (was default 1000ms)
  maxConnectionRetries: 2, // Explicit (SDK default)
  connectionRetryDelay: 500, // Explicit (SDK default)
});
```

**Rationale:**
- `connectTimeout: 10000` gives Windows enough time for TLS handshake and DNS
- `speechModel: 'universal-3-6'` ensures we're using a known-good streaming model
- Explicit retry params for transparency

#### 2. Enhanced Connection Logging (lines ~155-175)
```typescript
console.log(`[WebSocket] Connection config: sampleRate=16000, encoding=pcm_s16le, speechModel=universal-3-6, timeout=10000ms`);
try {
  const beginEvent = await st.connect();
  console.log(`[WebSocket] ✅ Connected to AssemblyAI v3 streaming for call ${callId}`);
  // ... session details
} catch (connectError: any) {
  console.error(`[WebSocket] ❌ AssemblyAI connection failed for call ${callId}`);
  console.error(`[WebSocket] Error type: ${connectError.name}`);
  console.error(`[WebSocket] Error message: ${connectError.message}`);
  if (connectError.cause) console.error(`[WebSocket] Error cause:`, connectError.cause);
  if (connectError.stack) console.error(`[WebSocket] Error stack:`, connectError.stack);
  throw connectError;
}
```

#### 3. Enhanced Error Handler (lines ~140-152)
```typescript
st.on('error', (error: Error) => {
  console.error(`[WebSocket] AssemblyAI error for call ${callId}:`, error);
  console.error(`[WebSocket] Error name: ${error.name}`);
  console.error(`[WebSocket] Error message: ${error.message}`);
  if ('cause' in error) console.error(`[WebSocket] Error cause:`, error.cause);
  if ('stack' in error) console.error(`[WebSocket] Error stack:`, error.stack);
  // ... send to frontend
});
```

## SDK Connection Flow (for reference)

From `assemblyai@4.41.5` streaming service:

1. **Create WebSocket connection** to `wss://streaming.assemblyai.com/v3/ws`
2. **Wait for socket 'open' event**
3. **Wait for server's "Begin" message** with session ID and expiry
4. **Timeout** if not received within `connectTimeout` ms
5. **Retry** up to `maxConnectionRetries` times on transient failures
6. **Permanent failures** (auth, insufficient funds) not retried

## What This Fixes

✅ **Increases timeout** from 1s to 10s for Windows networking  
✅ **Explicit model** ensures valid configuration  
✅ **Better diagnostics** to identify auth vs network vs timeout issues  
✅ **Preserves all functionality** (audio, transcripts, DB, validation)  
✅ **No security compromises** (TLS verification unchanged)

## Testing Instructions

1. **Restart backend**:
   ```bash
   cd backend
   npm start  # or npm run dev
   ```

2. **Watch backend logs** during connection:
   ```
   [WebSocket] New connection: /ws/calls/:callId/transcribe
   [WebSocket] Validating call...
   [WebSocket] Creating AssemblyAI client...
   [WebSocket] Creating streaming transcriber...
   [WebSocket] Attempting to connect to AssemblyAI v3 streaming...
   [WebSocket] Connection config: sampleRate=16000, encoding=pcm_s16le, speechModel=universal-3-6, timeout=10000ms
   ```

3. **Success case** (expected with 10s timeout):
   ```
   [WebSocket] ✅ Connected to AssemblyAI v3 streaming for call <callId>
   [WebSocket] Session ID: <id>, expires: <timestamp>
   [WebSocket] AssemblyAI session opened: <id> for call <callId>
   ```

4. **Failure case** (if still timing out):
   ```
   [WebSocket] ❌ AssemblyAI connection failed for call <callId>
   [WebSocket] Error type: Error
   [WebSocket] Error message: <detailed message>
   [WebSocket] Error cause: <cause details>
   [WebSocket] Error stack: <stack trace>
   ```

5. **Test with real audio**:
   - Click "Start Listening" in frontend
   - Speak: "Hello this is a test"
   - Backend should log:
     ```
     [WebSocket] Turn #1 (partial): Hello...
     [WebSocket] Turn #1 (final): Hello this is a test
     [WebSocket] Stored final transcript for call <callId>
     ```

## Remaining Blockers (if timeout persists)

If the connection still times out after 10 seconds:

1. **API Key Issue**
   - Verify `ASSEMBLYAI_API_KEY` in `backend/.env` is valid
   - Check AssemblyAI dashboard for API key status and credits

2. **Network Firewall**
   - Windows Firewall blocking outbound WSS connections
   - Corporate proxy/VPN interfering with WebSocket connections
   - Check: `telnet streaming.assemblyai.com 443` or use curl

3. **DNS Resolution**
   - Slow DNS lookup for `streaming.assemblyai.com`
   - Try adding to hosts file or using different DNS (8.8.8.8)

4. **TLS Issues**
   - Windows certificate store issues
   - Check with: `curl -v https://streaming.assemblyai.com/v3/ws`

5. **AssemblyAI Service Status**
   - Check https://status.assemblyai.com/
   - API rate limits or account issues

## Build Status
✅ TypeScript compiles successfully (exit code 0)

## Files Modified
- `backend/src/services/websocketHandler.ts` (timeout + model + logging)
- This diagnostic document
