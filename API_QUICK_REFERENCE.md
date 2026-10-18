# API Quick Reference

Base URL: `http://localhost:3000`

## Health Check

```bash
GET /health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": { "connected": true }
  }
}
```

---

## Create Call

```bash
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
    "id": "uuid-here",
    "current_stage_number": 1,
    "current_stage_name": "Opening",
    "status": "in_progress"
  }
}
```

---

## List Calls

```bash
GET /calls
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "prospect_name": "Dr. Anjali Menon",
      "reached_stage_name": "Permission",
      "outcome": "not_interested",
      "created_at": "2024-01-15T..."
    }
  ]
}
```

---

## Get Call Details

```bash
GET /calls/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "prospect_name": "...",
    "stage_results": [
      {
        "stage_number": 2,
        "stage_name": "Purpose",
        "quick_tap_events": ["Asked what we do"],
        "prospect_words": "What is this regarding?"
      }
    ]
  }
}
```

---

## Save Stage Result

```bash
POST /calls/:id/stages
Content-Type: application/json

{
  "stage_number": 2,
  "quick_tap_events": [
    "Asked what we do",
    "Said make it quick"
  ],
  "prospect_words": "What is this regarding?",
  "stage_notes": "Prospect seemed busy"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "call_id": "uuid",
    "stage_number": 2,
    "stage_name": "Purpose"
  }
}
```

---

## Close Call

```bash
POST /calls/:id/close
Content-Type: application/json

{
  "reached_stage_number": 3,
  "outcome": "not_interested",
  "prospect_key_words": "Not the right time",
  "agreed_next_action": null
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "closed",
    "outcome": "not_interested",
    "closed_at": "2024-01-15T..."
  }
}
```

---

## Official Stages (1-8)

1. **Opening** - Initial contact
2. **Purpose** - State reason for call
3. **Permission** - Ask to proceed
4. **Their business** - Understand their company
5. **Their need, in their words** - Capture prospect's exact words
6. **Objection** - Handle concerns
7. **Next step** - Agree on action
8. **Close** - End call

---

## Valid Outcomes

- `next_step_agreed` - Meeting/call scheduled
- `agreed_to_receive_report` - Document to be sent
- `interested` - Interest without fixed next step
- `follow_up` - Caller to call again
- `call_again` - Technical/language issue
- `not_interested` - Prospect declined
- `do_not_call` - Requested no further contact
- `wrong_person` - Not the target person
- `moved_company` - Person no longer there
- `not_logged` - No outcome recorded

---

## Error Responses

All errors return:
```json
{
  "success": false,
  "error": "Error description",
  "message": "Additional details"
}
```

**Status Codes:**
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (e.g., call already closed)
- `500` - Internal Server Error

---

## Testing with curl

```bash
# Create call
curl -X POST http://localhost:3000/calls \
  -H "Content-Type: application/json" \
  -d '{"prospect_name":"Test","company_name":"Test Co"}'

# List calls
curl http://localhost:3000/calls

# Get specific call (replace CALL_ID)
curl http://localhost:3000/calls/CALL_ID

# Save stage (replace CALL_ID)
curl -X POST http://localhost:3000/calls/CALL_ID/stages \
  -H "Content-Type: application/json" \
  -d '{"stage_number":2,"quick_tap_events":["test"]}'

# Close call (replace CALL_ID)
curl -X POST http://localhost:3000/calls/CALL_ID/close \
  -H "Content-Type: application/json" \
  -d '{"reached_stage_number":3,"outcome":"not_interested"}'
```
