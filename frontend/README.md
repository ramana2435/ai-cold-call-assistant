# AI Cold-Call Assistant - Frontend

React 18 + Vite + TypeScript + Tailwind CSS frontend for the AI Cold-Call Assistant application.

## Features

✅ **Dashboard** - View all calls with stage badges and outcomes  
✅ **Call Creation** - Start new calls with prospect information  
✅ **8-Stage Workflow** - Navigate through the official cold-call stages  
✅ **Quick-Tap Controls** - Capture common prospect responses with one click  
✅ **Prospect Words** - Record exact words spoken by prospects  
✅ **AI Actions** - Get AI-powered suggestions and analysis  
✅ **Close from Any Stage** - End calls early with proper outcome tracking  
✅ **Responsive Design** - Works on mobile and desktop  

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:3000

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Frontend runs on: **http://localhost:5173**

### Production Build

```bash
npm run build
npm run preview
```

## Environment Variables

Create a `.env` file (optional):

```env
VITE_API_BASE_URL=http://localhost:3000
```

If not set, defaults to `http://localhost:3000`.

## Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.tsx    # Call list view
│   │   ├── CallForm.tsx     # New call form
│   │   ├── CallWorkspace.tsx # Main call interface
│   │   ├── StageNavigation.tsx # 8-stage sidebar
│   │   ├── StageContent.tsx # Current stage display
│   │   ├── QuickTapButtons.tsx # Event capture buttons
│   │   ├── ProspectWordsInput.tsx # Text input for quotes
│   │   ├── CloseCallModal.tsx # Call closing form
│   │   ├── AIActionsPanel.tsx # AI features
│   │   └── CallCard.tsx     # Dashboard call item
│   ├── services/
│   │   └── api.ts           # API client (10 endpoints)
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   ├── constants/
│   │   └── stages.ts        # 8 stages config
│   ├── App.tsx              # Router
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind imports
├── dist/                    # Production build
├── package.json
└── vite.config.ts
```

## The 8 Official Stages

1. **Opening** - Initial contact and identification
2. **Purpose** - State reason for calling
3. **Permission** - Ask to proceed
4. **Their business** - Understand their company
5. **Their need, in their words** - Capture prospect's exact statement
6. **Objection** - Handle concerns
7. **Next step** - Agree on action
8. **Close** - End call with outcome

## Call Outcomes

- `next_step_agreed` - Meeting/call scheduled
- `agreed_to_receive_report` - Document to be sent
- `interested` - Interest without fixed step
- `follow_up` - Caller to call again
- `call_again` - Technical issues
- `not_interested` - Prospect declined
- `do_not_call` - Requested no contact
- `wrong_person` - Not the target
- `moved_company` - Person left
- `not_logged` - No outcome recorded

## API Integration

Connects to backend at `http://localhost:3000`:

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Health check |
| `POST /calls` | Create call |
| `GET /calls` | List all calls |
| `GET /calls/:id` | Get call details |
| `POST /calls/:id/stages` | Save stage result |
| `POST /calls/:id/close` | Close call |
| `POST /calls/:id/analyze` | AI transcript analysis |
| `POST /calls/:id/suggest-stage` | AI stage suggestion |
| `POST /calls/:id/suggest-response` | AI response recommendation |
| `GET /calls/:id/intelligence` | AI call intelligence |

## Component Overview

### Dashboard

- Lists all calls (newest first)
- Shows stage reached and outcome
- Empty state with "Start Your First Call" button
- Loading and error states with retry

### CallForm

- Collects prospect name, company, role, context
- Validates required fields
- Creates call and navigates to workspace

### CallWorkspace

- Three-column layout:
  - Left: Stage navigation (1-8)
  - Center: Stage content (guidance, quick-taps, prospect words)
  - Right: AI actions panel
- Header shows prospect info, elapsed time, end call button
- Tracks current stage and saved stages

### StageContent

- Displays stage-specific guidance
- "She may say" examples from real transcripts
- 4 quick-tap buttons (multi-select)
- Prospect words textarea with character counter
- Optional notes field
- Save button with success confirmation

### CloseCallModal

- Available from any stage
- Collects reached stage, outcome, key words, next action
- Next action field conditional (only for next_step_agreed/follow_up)
- Validates and submits to close endpoint

### AIActionsPanel

- **Analyze Transcript** - Get AI analysis of call
- **Suggest Next Stage** - AI recommends which stage to advance to
- **Suggest Response** - Get talking points for current stage
- **Get Intelligence** - Summary of call insights
- Results display in structured cards

## Quick-Tap Events by Stage

**Stage 1 (Opening):**
- Reached decision maker
- Spoke to receptionist
- Left voicemail
- Call connected

**Stage 2 (Purpose):**
- Asked what we do
- Asked where we got number
- Said make it quick
- Let me go on

**Stage 3 (Permission):**
- Gave permission
- Asked to call back
- Said they're busy
- Requested more info

**Stage 4 (Their business):**
- Described their practice
- Mentioned current systems
- Asked about our service
- Showed interest

**Stage 5 (Their need, in their words):**
- Stated specific need
- Mentioned pain point
- Described current problem
- Expressed interest

**Stage 6 (Objection):**
- Not the right person
- Already have solution
- Not interested right now
- Send information first

**Stage 7 (Next step):**
- Agreed to meeting
- Asked for proposal
- Requested follow-up call
- Wanted email first

**Stage 8 (Close):**
- Confirmed next step
- Thanked for time
- Set calendar invite
- Ended positively

## Development Notes

### TypeScript

- Strict mode enabled
- No unused locals/parameters
- All components fully typed
- API responses typed

### Styling

- Tailwind CSS utility classes
- Blue accent color (#3B82F6)
- Responsive breakpoints (sm, md, lg)
- Mobile-first design

### State Management

- React hooks (useState, useEffect)
- Component-level state
- No global state library needed

### Error Handling

- All API calls wrapped in try-catch
- Error states displayed with red alerts
- Retry buttons on dashboard and form errors

## Security

✅ No API keys in frontend code  
✅ No Supabase credentials exposed  
✅ Backend handles all sensitive operations  
✅ CORS configured on backend  
✅ Input validation on forms  

## Testing

Run backend tests:

```bash
cd ../backend
npm test
```

Frontend tests not yet implemented. Manual testing workflow:

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Create new call
4. Navigate through stages 1-8
5. Test quick-tap buttons (multi-select)
6. Enter prospect words
7. Test AI action buttons
8. Close call from stage 3 (early exit test)
9. Verify dashboard shows call with correct stage

## Known Issues

1. **CloseCallModal outcome default** - Defaults to "not_logged" instead of requiring explicit selection
2. **Error retry** - Some error states lack retry buttons (CallForm, AIActionsPanel)
3. **AI input UX** - Uses `prompt()` for transcript/question input (blocking, poor UX)
4. **Stage navigation** - Allows jumping to past stages without warning about unsaved changes

## Future Enhancements

- [ ] Frontend tests (Jest + React Testing Library)
- [ ] Better AI input forms (modal instead of prompt)
- [ ] Retry mechanisms on all error states
- [ ] Unsaved changes warning
- [ ] Require explicit outcome selection
- [ ] Call duration in dashboard cards
- [ ] Stage progress visualization
- [ ] Export call history
- [ ] Keyboard shortcuts
- [ ] Dark mode

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### "Failed to fetch" errors

**Cause:** Backend not running or CORS issue

**Solution:**
1. Start backend: `cd backend && npm run dev`
2. Verify health: `curl http://localhost:3000/health`
3. Check CORS_ORIGINS in backend/.env includes http://localhost:5173

### Port 5173 already in use

**Solution:**
```bash
# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Or change port in `vite.config.ts`:

```typescript
export default defineConfig({
  server: { port: 3001 }
})
```

### Build fails with TypeScript errors

**Solution:**
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

### AI actions show "API key not configured"

**Cause:** Backend missing GEMINI_API_KEY

**Solution:**
1. Add GEMINI_API_KEY to `backend/.env`
2. Restart backend server

## License

This project is developed for a time-limited challenge.

---

**Status:** ✅ Frontend Complete  
**Backend:** http://localhost:3000  
**Frontend:** http://localhost:5173  
**Last Updated:** January 2024
