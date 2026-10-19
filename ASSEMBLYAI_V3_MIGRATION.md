# AssemblyAI v3 Streaming API Migration

## Problem
The backend was using the deprecated v2 real-time API (`client.realtime`) with a v3 endpoint, causing connection hangs. The v2 SDK service expected "SessionBegins" messages but v3 sends "Begin" messages, causing `connect()` to wait indefinitely.

## Solution
Migrated from `client.realtime.transcriber()` to `client.streaming.transcriber()` to use the current v3 streaming API.

## Changes Made

### 1. Import Updates (`websocketHandler.ts` lines 1-15)
```typescript
// OLD
import { AssemblyAI, RealtimeService } from 'assemblyai';
interface ClientConnection {
  assemblyWs?: RealtimeService;
}

// NEW
import { AssemblyAI } from 'assemblyai';
import type { StreamingTranscriber } from 'assemblyai';
interface ClientConnection {
  assemblyWs?: StreamingTranscriber;
}
```

### 2. Transcriber Creation (lines 70-85)
```typescript
// OLD
const rt = client.realtime.transcriber({
  realtimeUrl: 'wss://streaming.assemblyai.com/v3/ws',
  sampleRate: 16000,
  encoding: 'pcm_s16le',
});

// NEW (default endpoint is already v3)
const st = client.streaming.transcriber({
  sampleRate: 16000,
  encoding: 'pcm_s16le',
});
```

### 3. Event Handlers (lines 90-140)

#### "open" Event
```typescript
// OLD
rt.on('open', ({ sessionId }) => {
  console.log(`AssemblyAI session opened: ${sessionId}`);
  ws.send(JSON.stringify({ session_id: sessionId }));
});

// NEW
st.on('open', (event) => {
  console.log(`AssemblyAI session opened: ${event.id}`);
  console.log(`Session expires at: ${new Date(event.expires_at).toISOString()}`);
  ws.send(JSON.stringify({ session_id: event.id }));
});
```

#### Transcript/Turn Event
```typescript
// OLD
rt.on('transcript', async (transcript) => {
  const isFinal = transcript.message_type === 'FinalTranscript';
  const text = transcript.text;
  const confidence = transcript.confidence;
});

// NEW
st.on('turn', async (turn) => {
  const isFinal = turn.end_of_turn;
  const text = turn.transcript;
  const confidence = turn.end_of_turn_confidence;
  const speaker = turn.speaker_label;  // Now available!
  console.log(`Turn #${turn.turn_order} (${isFinal ? 'final' : 'partial'}): ${text}`);
});
```

#### "close" Event
```typescript
// OLD
rt.on('close', () => {
  console.log('AssemblyAI session closed');
});

// NEW
st.on('close', (code, reason) => {
  console.log(`AssemblyAI session closed (code: ${code}, reason: ${reason})`);
});
```

### 4. Connection (lines 155-165)
```typescript
// OLD
await rt.connect();  // Returns Promise<void>

// NEW
const beginEvent = await st.connect();  // Returns Promise<BeginEvent>
console.log(`Session ID: ${beginEvent.id}, expires: ${new Date(beginEvent.expires_at).toISOString()}`);
```

### 5. Audio Sending (unchanged - same API)
```typescript
st.sendAudio(audioBuffer.buffer);  // Same as before
```

## Key Differences: v2 vs v3

| Feature | v2 (realtime) | v3 (streaming) |
|---------|--------------|----------------|
| Service | `client.realtime` | `client.streaming` |
| Endpoint | `wss://api.assemblyai.com/v2/realtime/ws` | `wss://streaming.assemblyai.com/v3/ws` (default) |
| Handshake | "SessionBegins" message | "Begin" message |
| Transcript event | `on('transcript')` with `message_type` | `on('turn')` with `end_of_turn` |
| Session ID | `{ sessionId: string }` | `{ id: string, expires_at: number }` |
| Connect result | `Promise<void>` | `Promise<BeginEvent>` |
| Close handler | `on('close', () => {})` | `on('close', (code, reason) => {})` |
| Speaker labels | Not in real-time | `turn.speaker_label` available |

## Testing Checklist

- [x] TypeScript compiles without errors
- [ ] Backend starts successfully
- [ ] Browser connects to backend WebSocket (`/ws/calls/:callId/transcribe`)
- [ ] Backend logs "Connected to AssemblyAI v3 streaming"
- [ ] Speaking produces transcript text in logs
- [ ] Partial transcripts appear during speech
- [ ] Final transcripts stored in database after turn ends
- [ ] Frontend displays transcripts in real-time

## Benefits of v3 API

1. **Turn-based structure**: Clear distinction between partial and final transcripts via `end_of_turn`
2. **Better diagnostics**: `close` event includes code and reason
3. **Session metadata**: `expires_at` timestamp for session management
4. **Speaker labels**: Real-time diarization available via `speaker_label`
5. **Turn ordering**: `turn_order` for tracking conversation sequence
6. **Active support**: v2 is deprecated, v3 is actively maintained

## Files Modified
- `backend/src/services/websocketHandler.ts` (complete v2→v3 migration)

## Next Steps
1. Restart backend server
2. Test with browser: Start Listening → speak test sentence
3. Verify logs show successful connection and transcripts
4. Confirm database stores final segments
