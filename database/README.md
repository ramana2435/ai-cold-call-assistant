# Database Schema

## Overview

This database supports the AI Cold-Call Assistant application, tracking calls through 8 official stages:

1. Opening
2. Purpose
3. Permission
4. Their business
5. Their need, in their words
6. Objection
7. Next step
8. Close

## Tables

### `calls`
Stores high-level call information including prospect details, current progress, status, outcome, and timestamps.

**Key fields:**
- `prospect_name`, `company_name`, `prospect_role`, `call_context`
- `current_stage_number` (1-8) and `current_stage_name`
- `reached_stage_number` (1-8) and `reached_stage_name` — furthest stage before ending
- `status`: 'in_progress' or 'closed'
- `outcome`: One of 10 predefined outcomes (null while in progress)
- `prospect_key_words`: Important quotes from the prospect
- `agreed_next_action`: Follow-up action if agreed

### `call_stage_results`
Stores detailed results for each stage progression within a call.

**Key fields:**
- `call_id`: Foreign key to calls table
- `stage_number` (1-8) and `stage_name`
- `quick_tap_events`: JSONB array of selected events (e.g., `["Asked what we do", "Said make it quick"]`)
- `prospect_words`: Verbatim quote from prospect (critical for Stage 5)
- `stage_notes`: Optional additional context

## Setup Instructions

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Note your project URL and service role key

### 2. Run Migration
1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `schema.sql`
4. Execute the SQL script

### 3. Configure Environment
1. Copy `backend/.env.example` to `backend/.env`
2. Update with your Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### 4. Verify Schema
Run this query in Supabase SQL Editor to verify tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('calls', 'call_stage_results');
```

## Data Types

### Enums

**call_status:**
- `in_progress`
- `closed`

**call_outcome:**
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

**stage_name:**
- `Opening`
- `Purpose`
- `Permission`
- `Their business`
- `Their need, in their words`
- `Objection`
- `Next step`
- `Close`

## Indexes

Optimized indexes for common queries:
- Status filtering
- Date sorting (newest first)
- Outcome filtering
- Prospect/company name search
- Stage results by call and stage number

## Constraints

- Stage numbers must be between 1 and 8
- Closed calls must have `closed_at` timestamp and `outcome`
- In-progress calls cannot have `closed_at` or `outcome`
- `quick_tap_events` must be a valid JSON array
- Stage results cascade delete with parent call

## Migration Notes

If you need to modify the schema later, create new migration files named:
- `002_add_feature.sql`
- `003_modify_table.sql`

Always test migrations on a development database first.
