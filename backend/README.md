# AI Cold-Call Assistant - Backend API

Backend service for the AI Cold-Call Assistant, built with Node.js, Express, TypeScript, and Supabase PostgreSQL.

## Features

- ✅ RESTful API for managing cold calls through 8 official stages
- ✅ Supabase PostgreSQL database integration
- ✅ TypeScript for type safety
- ✅ Comprehensive request validation
- ✅ Multiple quick-tap event support per stage
- ✅ Close calls at any stage
- ✅ Complete test suite

## Official Call Stages

The system supports these 8 stages in exact order:

1. **Opening** - Initial contact
2. **Purpose** - State reason for call
3. **Permission** - Ask to proceed
4. **Their business** - Understand their company
5. **Their need, in their words** - Capture prospect's exact words
6. **Objection** - Handle concerns
7. **Next step** - Agree on action
8. **Close** - End call

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git (for version control)

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

CORS_ORIGINS=http://localhost:3001,http://localhost:5173
```

### 3. Set Up Database

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor in your project dashboard
3. Copy contents of `../database/schema.sql`
4. Execute the SQL script
5. Verify tables exist with:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('calls', 'call_stage_results');
   ```

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Endpoints

### Health Check

```http
GET /health
```

Returns server and database status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {
      "connected": true
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Create Call

```http
POST /calls
Content-Type: application/json

{
  "prospect_name": "Dr. Anjali Menon",
  "company_name": "Menon Family Clinic",
  "prospect_role": "Owner",
  "call_context": "first call"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "prospect_name": "Dr. Anjali Menon",
    "company_name": "Menon Family Clinic",
    "prospect_role": "Owner",
    "call_context": "first call",
    "current_stage_number": 1,
    "current_stage_name": "Opening",
    "reached_stage_number": 1,
    "reached_stage_name": "Opening",
    "status": "in_progress",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Call created successfully"
}
```

### List All Calls

```http
GET /calls
```

Returns all calls ordered by newest first.

### Get Call Details

```http
GET /calls/:id
```

Returns call with all stage results.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "prospect_name": "Dr. Anjali Menon",
    "...",
    "stage_results": [
      {
        "id": "uuid",
        "call_id": "uuid",
        "stage_number": 2,
        "stage_name": "Purpose",
        "quick_tap_events": ["Asked what we do", "Said make it quick"],
        "prospect_words": "What is this regarding?",
        "created_at": "2024-01-15T10:31:00.000Z"
      }
    ]
  }
}
```

### Save Stage Result

```http
POST /calls/:id/stages
Content-Type: application/json

{
  "stage_number": 2,
  "quick_tap_events": ["Asked what we do", "Said make it quick"],
  "prospect_words": "What is this regarding?",
  "stage_notes": "Prospect seemed rushed"
}
```

**Notes:**
- `quick_tap_events` is an array - supports multiple selections
- `prospect_words` captures verbatim quotes (critical for Stage 5)
- Updates call's `current_stage` and `reached_stage` automatically

### Close Call

```http
POST /calls/:id/close
Content-Type: application/json

{
  "reached_stage_number": 3,
  "outcome": "not_interested",
  "prospect_key_words": "Not the right time",
  "agreed_next_action": null
}
```

**Valid outcomes:**
- `next_step_agreed`
- `agreed_to_receive_report`
- `interested`
- `follow_up`
- `call_again`
- `not_interested`
- `do_not_call`
- `wrong_person`
- `moved_company`
- `not_logged`

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "message": "Additional details"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (e.g., call already closed)
- `500` - Internal Server Error
- `503` - Service Unavailable (health check failure)

## Testing

### Mock Tests (No Database Required)

Tests validation, request structure, and error handling without needing Supabase:

```bash
npm test
```

**Tests include:**
- Health endpoint validation
- Stage number constraints (1-8)
- Official stage name mapping
- Invalid UUID rejection
- Required field validation
- Multiple quick-tap events support
- Outcome enum validation
- Closing at different stages (1, 3, 6)
- 404 handling

### Integration Tests (Requires Supabase)

To run integration tests with real database:

1. Configure `.env` with test database credentials
2. Run: `npm test -- --testPathPattern=integration`

**Note:** Integration tests are separated from mock tests to allow CI/CD without database dependencies.

## Project Structure

```
backend/
├── src/
│   ├── __tests__/          # Test files
│   ├── config/             # Configuration
│   ├── db/                 # Database client
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── types/              # TypeScript types
│   ├── validators/         # Request validation
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server entry point
├── .env.example           # Environment template
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── README.md             # This file
```

## Troubleshooting

### Server starts but shows "degraded" health

- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `.env`
- Verify credentials are correct
- Ensure database schema has been migrated

### Database connection fails

- Verify Supabase project is active
- Check that service role key (not anon key) is used
- Confirm IP address is allowed in Supabase project settings

### Tests fail with "Call not found"

- Mock tests should pass without database
- Integration tests require configured Supabase connection
- Check that test database is properly seeded

### Stage validation errors

- Stage numbers must be 1-8 (not 0-based)
- Stage names must match exactly (see STAGE_NAMES in types/index.ts)
- Cannot save stages for closed calls

## Development Notes

- TypeScript strict mode enabled
- ESLint configured for code quality
- Jest for testing with coverage
- Automatic timestamp updates via database trigger
- Foreign key cascades on call deletion
- JSONB for flexible quick_tap_events storage

## Security

- Service role key never exposed to frontend
- Input validation on all endpoints
- SQL injection protection via Supabase client
- CORS configured for specific origins
- Environment variables for secrets

## Next Steps

After backend is running:

1. ✅ Verify health endpoint returns "healthy"
2. ✅ Test create call endpoint
3. ✅ Test save stage and close call workflows
4. 🔄 Build frontend UI (Module 2)
5. 🔄 Integrate AI suggestions (Module 4)
6. 🔄 Add multilingual support (Module 6)

## Support

For issues or questions about this backend implementation, check:

1. Database schema: `../database/schema.sql`
2. API documentation above
3. Test files for usage examples
4. Supabase project logs for database errors
