# Test Guide: Closed Call Read-Only Mode

## Quick Test Steps

### Prerequisites
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser to `http://localhost:5173`

---

## Test 1: Open Call (Normal Editing)

**Purpose:** Verify normal editing still works

### Steps
1. From dashboard, click "New Call"
2. Enter prospect details and create call
3. Navigate to Stage 1
4. **Verify:**
   - ✅ Quick-tap buttons are clickable and change color
   - ✅ Can type in "Her Words" textarea
   - ✅ Can type in "Additional Notes" textarea
   - ✅ "Save Stage Progress" button is visible
   - ✅ Clicking save shows "✓ Saved" confirmation
   - ✅ No warning banners appear

### Expected Result
All editing works normally, no restrictions.

---

## Test 2: Close a Call

**Purpose:** Create a closed call for testing

### Steps
1. From Stage 1, click "NEXT: PURPOSE →" repeatedly to reach Stage 8
2. At Stage 8, click "End Call" button (top right)
3. In modal:
   - Select reached stage: Stage 8
   - Select outcome: "Not Interested"
   - Click "Close Call"
4. **Verify:** Redirected to dashboard
5. Find the closed call in the list

### Expected Result
Call appears in dashboard with status badge.

---

## Test 3: View Closed Call (Read-Only Mode)

**Purpose:** Verify read-only restrictions work

### Steps
1. From dashboard, click on the closed call
2. **Verify Top Banner:**
   - ✅ Blue banner appears below header
   - ✅ Shows checkmark icon
   - ✅ Text: "Call Closed • Outcome: NOT INTERESTED • Read-Only Mode"
   - ✅ "End Call" button is hidden (not in header)

3. Navigate to any stage (e.g., Stage 1)

4. **Verify Warning Banner:**
   - ✅ Yellow warning banner appears above stage content
   - ✅ Shows warning icon
   - ✅ Text: "Read-only: This call is closed. Stage information cannot be edited."

5. **Verify Quick-Tap Buttons:**
   - ✅ Buttons appear grayed out (lower opacity)
   - ✅ Clicking does nothing (no color change)
   - ✅ Cursor shows "not-allowed" icon on hover
   - ✅ Previously selected buttons still show selected state

6. **Verify Her Words Textarea:**
   - ✅ Gray background
   - ✅ Cannot type or edit text
   - ✅ Existing text is visible
   - ✅ Cursor shows "not-allowed" icon
   - ✅ No focus ring appears when clicked

7. **Verify Additional Notes Textarea:**
   - ✅ Gray background
   - ✅ Cannot type or edit text
   - ✅ Existing text is visible
   - ✅ Cursor shows "not-allowed" icon
   - ✅ No focus ring appears when clicked

8. **Verify Save Button:**
   - ✅ "Save Stage Progress" button is completely hidden
   - ✅ No disabled button, no placeholder
   - ✅ Bottom of form is empty (clean)

9. Navigate to different stages (Stage 1 → 8)

10. **Verify:**
    - ✅ Can view all stages
    - ✅ All stages show read-only mode
    - ✅ Warning banner appears on every stage
    - ✅ All inputs disabled on every stage

### Expected Result
Complete read-only experience with clear visual indicators.

---

## Test 4: Browser Console Check

**Purpose:** Verify no errors or warnings

### Steps
1. Open browser DevTools (F12)
2. Go to Console tab
3. Interact with closed call:
   - Navigate between stages
   - Try clicking disabled buttons
   - Try clicking in disabled textareas

4. **Verify:**
   - ✅ No JavaScript errors
   - ✅ No React warnings
   - ✅ No network requests to `/calls/:id/stages` endpoint
   - ✅ Only GET requests for call data

### Expected Result
Clean console, no errors, no failed network requests.

---

## Test 5: Backend Protection (Direct API Test)

**Purpose:** Verify backend still rejects edits to closed calls

### Prerequisites
- Get a closed call ID from the dashboard
- Example: `681f7931-e7d2-415b-a8a0-e80b4a4b4b7b`

### Test with curl

```bash
curl -X POST http://localhost:3000/calls/<closed-call-id>/stages \
  -H "Content-Type: application/json" \
  -d '{
    "stage_number": 8,
    "stage_name": "Close",
    "quick_tap_events": ["Test Event"],
    "stage_notes": "This should fail"
  }' \
  -v
```

### Expected Response
```json
{
  "success": false,
  "error": "Cannot save stage result for a closed call"
}
```

**Status Code:** 500

### Expected Result
Backend correctly rejects the request.

---

## Test 6: Compare Open vs Closed

**Purpose:** Side-by-side comparison

### Setup
1. Have one open call
2. Have one closed call
3. Open both in separate browser tabs

### Compare Side-by-Side

| Feature | Open Call | Closed Call |
|---------|-----------|-------------|
| Top banner | "End Call" button visible | "Call Closed • Read-Only Mode" banner |
| Warning banner | None | Yellow warning present |
| Quick-tap buttons | Clickable, hover effects | Disabled, grayed out |
| Her Words textarea | White, editable | Gray, disabled |
| Notes textarea | White, editable | Gray, disabled |
| Save button | Visible and enabled | Hidden |
| Stage navigation | Works | Works (view only) |

### Expected Result
Clear visual distinction between editable and read-only modes.

---

## Test 7: Edge Cases

### Test 7a: Stage Without Data
1. View a closed call
2. Navigate to a stage that has no saved data
3. **Verify:**
   - ✅ Empty fields shown
   - ✅ Still disabled
   - ✅ Still shows read-only warnings

### Test 7b: Stage With Full Data
1. View a closed call
2. Navigate to Stage 5 or Stage 8 (likely has data)
3. **Verify:**
   - ✅ All saved data displayed correctly
   - ✅ Selected quick-taps show selected state (but disabled)
   - ✅ Prospect words visible (but not editable)
   - ✅ Notes visible (but not editable)

### Test 7c: Rapid Stage Navigation
1. View a closed call
2. Quickly click through stages: 1→2→3→4→5→6→7→8
3. **Verify:**
   - ✅ No lag or errors
   - ✅ Read-only mode persists on all stages
   - ✅ No console errors

### Expected Result
All edge cases handled gracefully.

---

## Regression Tests (Must Still Work)

### Open Call Functionality
- [ ] Can create new call
- [ ] Can navigate stages
- [ ] Can select/deselect quick-tap buttons
- [ ] Can type prospect words
- [ ] Can type notes
- [ ] Can save stage progress
- [ ] Can advance to next stage
- [ ] Can close call from any stage

### Closed Call Viewing
- [ ] Can view closed call from dashboard
- [ ] Can navigate between stages
- [ ] Can see all saved data
- [ ] Cannot edit anything
- [ ] No save button present

### AI Actions (Both Open and Closed)
- [ ] AI Actions panel visible on right
- [ ] Can click "Analyze Transcript" (may work on closed calls)
- [ ] Can click "Suggest Next Stage"
- [ ] Can click "Suggest Response"
- [ ] Can click "Get Intelligence"

---

## Visual Inspection Checklist

### Read-Only Indicators Present
- [ ] Blue banner at top with checkmark
- [ ] Yellow warning banner in stage content
- [ ] Grayed-out quick-tap buttons
- [ ] Gray background on textareas
- [ ] No save button visible
- [ ] Disabled cursor icon on hover

### Read-Only Indicators Absent (Open Calls)
- [ ] No blue banner
- [ ] No yellow warning banner
- [ ] Normal button colors
- [ ] White textarea backgrounds
- [ ] Save button visible and blue

---

## Expected Behavior Summary

### ✅ What Should Happen

**Closed Calls:**
- Clear visual indication of read-only mode
- All inputs disabled but data visible
- No save button
- Can navigate and view stages
- No errors or failed requests

**Open Calls:**
- Normal editing behavior unchanged
- All features work as before
- Save button functional

**Backend:**
- Continues to reject edits to closed calls
- Returns clear error message if attempted

### ❌ What Should NOT Happen

**Closed Calls:**
- Should NOT be editable
- Should NOT show save button
- Should NOT send POST requests on interaction
- Should NOT allow reopening (unless designed)

**Open Calls:**
- Should NOT show read-only warnings
- Should NOT have disabled inputs
- Should NOT hide save button

---

## Troubleshooting

### Issue: Read-only mode not showing
**Check:**
1. Call is actually closed (status: 'closed')
2. Frontend code rebuilt: `npm run build`
3. Browser cache cleared (hard refresh: Ctrl+Shift+R)
4. No console errors

### Issue: Can still edit closed call
**Check:**
1. `isReadOnly` prop being passed to StageContent
2. `disabled` prop on inputs
3. Save button has `{!isReadOnly && ...}` condition
4. Browser DevTools → Components → verify props

### Issue: Open call shows read-only
**Check:**
1. Call status is 'in_progress' not 'closed'
2. Verify in database or API response
3. Check `isCompleted` logic in CallWorkspace

---

## Success Criteria

✅ **Pass:** All tests complete without issues  
✅ **Pass:** No console errors during testing  
✅ **Pass:** Clear distinction between open/closed  
✅ **Pass:** Backend protection still works  
✅ **Pass:** Open calls unaffected  

❌ **Fail:** Can edit closed call fields  
❌ **Fail:** Save button visible on closed call  
❌ **Fail:** Console errors present  
❌ **Fail:** Backend allows saving to closed call  
❌ **Fail:** Open call editing broken  

---

## Quick Commands Reference

```bash
# Build both projects
cd backend && npm run build && cd ../frontend && npm run build

# Start backend
cd backend && npm start

# Start frontend (new terminal)
cd frontend && npm run dev

# Test API directly
curl http://localhost:3000/calls/<call-id>

# Attempt save to closed call (should fail)
curl -X POST http://localhost:3000/calls/<closed-call-id>/stages \
  -H "Content-Type: application/json" \
  -d '{"stage_number":8,"stage_name":"Close","quick_tap_events":[]}'
```

---

**Testing Time:** ~10-15 minutes for complete test suite  
**Status:** Ready for QA  
**Date:** October 18, 2026
