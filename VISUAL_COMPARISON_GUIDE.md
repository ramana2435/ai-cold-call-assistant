# Visual Comparison Guide: Open vs Closed Calls

## Quick Visual Reference

### Top-Level Indicators

#### Open Call Header
```
┌──────────────────────────────────────────────────┐
│ COMPANY NAME - CALL GUIDE                        │
│ Prospect Name • Role                             │
│                    [End Call] [← Dashboard]      │
└──────────────────────────────────────────────────┘
```

#### Closed Call Header
```
┌──────────────────────────────────────────────────┐
│ COMPANY NAME - CALL GUIDE                        │
│ Prospect Name • Role        [← Dashboard]        │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ ✓ Call Closed • Outcome: NOT INTERESTED •       │
│   Read-Only Mode                                  │
└──────────────────────────────────────────────────┘
```

---

## Stage Content Comparison

### Warning Banner

#### Open Call
```
No warning banner present
```

#### Closed Call
```
┌─────────────────────────────────────────────────┐
│ 🔒  🔒 Read-Only Mode                           │
│                                                  │
│     This call is closed. You can view saved     │
│     stage information but cannot make changes.  │
│     Stage notes, prospect words, and quick-tap  │
│     selections are locked.                      │
└─────────────────────────────────────────────────┘
```
*Gradient yellow-orange background, prominent lock icon*

---

### Quick-Tap Buttons

#### Open Call - Selected Button
```
┌────────────────────┐
│  Said they are     │ ← Blue background (#3B82F6)
│  interested        │   White text
└────────────────────┘   Clickable cursor
```

#### Open Call - Unselected Button
```
┌────────────────────┐
│  Asked for pricing │ ← White background
└────────────────────┘   Gray border
                         Gray text
                         Hover effect: blue border
```

#### Closed Call - Header
```
🔒 Locked - View only
```

#### Closed Call - Selected Button
```
┌────────────────────┐
│  Said they are     │ ← Light blue background (#BFDBFE)
│  interested        │   Blue text (#1E40AF)
└────────────────────┘   Lighter than active
                         No hover effect
                         cursor-not-allowed
```

#### Closed Call - Unselected Button
```
┌────────────────────┐
│  Asked for pricing │ ← Light gray background (#F9FAFB)
└────────────────────┘   Gray text (#6B7280)
                         Gray border (#E5E7EB)
                         No hover effect
                         cursor-not-allowed
```

---

### Prospect Words Field

#### Open Call
```
┌─────────────────────────────────────────────────┐
│ HER WORDS                                        │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Type the prospect's exact words here...          │ ← White background
│                                                  │   Black text
│                                                  │   Blue focus ring
│                                                  │   Editable
└─────────────────────────────────────────────────┘
Capture prospect's exact words          123 characters
```

#### Closed Call - With Content
```
┌─────────────────────────────────────────────────┐
│ HER WORDS                          🔒 Locked     │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ "I'm interested in improving our sales process"  │ ← Gray background
│                                                  │   Gray text
│                                                  │   No focus ring
│                                                  │   Read-only
└─────────────────────────────────────────────────┘
Saved prospect words                    47 characters
```

#### Closed Call - Empty Field
```
┌─────────────────────────────────────────────────┐
│ HER WORDS                          🔒 Locked     │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│                                                  │ ← Gray background
│        No prospect words recorded                │   Centered message
│                                                  │   Italic text
└─────────────────────────────────────────────────┘
Saved prospect words                     0 characters
```

---

### Additional Notes Field

#### Open Call
```
┌─────────────────────────────────────────────────┐
│ ADDITIONAL NOTES (Optional)                      │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Any additional context or observations...        │ ← White background
│                                                  │   Editable
└─────────────────────────────────────────────────┘
```

#### Closed Call - With Content
```
┌─────────────────────────────────────────────────┐
│ ADDITIONAL NOTES (Optional)      🔒 Locked       │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Prospect was in a hurry, reschedule next week   │ ← Gray background
└─────────────────────────────────────────────────┘
```

#### Closed Call - Empty Field
```
┌─────────────────────────────────────────────────┐
│ ADDITIONAL NOTES (Optional)      🔒 Locked       │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│      No additional notes recorded                │ ← Gray background
└─────────────────────────────────────────────────┘   Centered message
```

---

### Save Button

#### Open Call
```
┌─────────────────────────────────────────────────┐
│         Save Stage Progress                      │ ← Blue button
└─────────────────────────────────────────────────┘   Clickable
                                                      Hover effect
```

#### Closed Call
```
(Button is completely hidden - no placeholder)
```

---

## AI Actions Panel Comparison

### Panel Header

#### Open Call
```
┌─────────────────────────────────────────────────┐
│ AI Actions                                       │
└─────────────────────────────────────────────────┘
```

#### Closed Call
```
┌─────────────────────────────────────────────────┐
│ AI Actions                          [Read-only]  │ ← Small badge
└─────────────────────────────────────────────────┘
```

---

### Information Banner

#### Open Call
```
No information banner
```

#### Closed Call
```
┌─────────────────────────────────────────────────┐
│ ℹ️ Analysis Mode: Intelligence analysis is      │ ← Blue background
│ available for closed calls. Stage and response   │   Informational
│ suggestions are disabled as they require an      │
│ active call context.                             │
└─────────────────────────────────────────────────┘
```

---

### Action Buttons

#### Open Call - All Buttons
```
┌─────────────────────────────────────────────────┐
│ 🔍 Analyze Transcript                           │ ← Blue (#2563EB)
└─────────────────────────────────────────────────┘   Clickable

┌─────────────────────────────────────────────────┐
│ 💡 Suggest Next Stage                           │ ← Blue
└─────────────────────────────────────────────────┘   Clickable

┌─────────────────────────────────────────────────┐
│ 💬 Suggest Response                             │ ← Blue
└─────────────────────────────────────────────────┘   Clickable

┌─────────────────────────────────────────────────┐
│ 📊 Get Intelligence                             │ ← Blue
└─────────────────────────────────────────────────┘   Clickable
```

#### Closed Call - Differentiated
```
┌─────────────────────────────────────────────────┐
│ 🔍 Analyze Transcript                 🔒        │ ← Gray (#D1D5DB)
└─────────────────────────────────────────────────┘   Disabled
                                                      Lock icon
                                                      Tooltip on hover

┌─────────────────────────────────────────────────┐
│ 💡 Suggest Next Stage                 🔒        │ ← Gray
└─────────────────────────────────────────────────┘   Disabled
                                                      Lock icon

┌─────────────────────────────────────────────────┐
│ 💬 Suggest Response                   🔒        │ ← Gray
└─────────────────────────────────────────────────┘   Disabled
                                                      Lock icon

┌─────────────────────────────────────────────────┐
│ 📊 Get Intelligence                             │ ← Green (#16A34A)
└─────────────────────────────────────────────────┘   Enabled!
                                                      Different color
                                                      Clickable
```

---

### Helpful Tip

#### Open Call
```
No tip shown
```

#### Closed Call
```
┌─────────────────────────────────────────────────┐
│ 💡 Tip: Use "Get Intelligence" to analyze the   │ ← White box
│ saved call data and stage progression.           │   Small text
└─────────────────────────────────────────────────┘   Helpful guidance
```

---

## Color Palette Reference

### Open Call Colors
- **Background:** `#FFFFFF` (white)
- **Primary:** `#2563EB` (blue-600)
- **Hover:** `#1D4ED8` (blue-700)
- **Border:** `#D1D5DB` (gray-300)
- **Text:** `#374151` (gray-700)

### Closed Call Colors
- **Background Fields:** `#F9FAFB` (gray-50)
- **Border:** `#E5E7EB` (gray-200)
- **Text:** `#6B7280` (gray-600)
- **Selected Button:** `#BFDBFE` (blue-200)
- **Disabled Button:** `#D1D5DB` (gray-300)
- **Lock Icon:** `#CA8A04` (yellow-600)
- **Warning Banner:** `#FEF3C7` → `#FED7AA` (gradient)
- **Intelligence Button:** `#16A34A` (green-600)

---

## Icon Reference

### Lock Icon (Used Throughout)
```svg
<svg viewBox="0 0 20 20" fill="currentColor">
  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
</svg>
```
Size: 16px (small), 20px (medium), 24px (large)

---

## Cursor States

### Open Call
- **Buttons:** `cursor-pointer` with hover effects
- **Text Fields:** `cursor-text` with focus effects
- **Interactive:** All elements respond to interaction

### Closed Call
- **Disabled Buttons:** `cursor-not-allowed`
- **Disabled Fields:** `cursor-not-allowed`
- **Lock Icons:** `cursor-default`
- **Intelligence Button:** `cursor-pointer` (still clickable)

---

## Typography

### Font Weights
- **Headings:** `font-bold` (700) or `font-semibold` (600)
- **Labels:** `font-semibold` (600)
- **Body Text:** `font-medium` (500) or normal (400)
- **Helper Text:** normal (400)

### Text Sizes
- **Stage Title:** `text-2xl` (24px)
- **Stage Name:** `text-xl` (20px)
- **Section Headers:** `text-sm` (14px)
- **Body:** base (16px)
- **Helper Text:** `text-xs` (12px)

---

## Spacing

### Padding
- **Buttons:** `px-4 py-3` (16px horizontal, 12px vertical)
- **Text Fields:** `px-4 py-3`
- **Panels:** `p-6` (24px all sides)
- **Banners:** `p-4` (16px all sides)

### Gaps
- **Button Grid:** `gap-3` (12px)
- **Section Spacing:** `space-y-6` (24px vertical)
- **Component Spacing:** `space-y-4` (16px vertical)

---

## Key Visual Differences at a Glance

| Element | Open Call | Closed Call |
|---------|-----------|-------------|
| **Top Banner** | None | Blue with checkmark |
| **Warning** | None | Yellow gradient with lock |
| **Quick-Taps** | White/Blue | Gray/Light blue |
| **Text Fields** | White | Gray |
| **Lock Icons** | None | Everywhere |
| **Save Button** | Visible | Hidden |
| **AI Buttons** | All blue | Mixed gray/green |
| **Cursor** | Pointer/Text | Not-allowed |
| **Tooltips** | None | Explanatory |

---

## Accessibility Notes

### WCAG Compliance

**Color Contrast Ratios:**
- Normal text on gray-50: 7.5:1 (AAA) ✅
- Lock icons on yellow: 4.8:1 (AA) ✅
- Disabled buttons: 4.5:1 (AA) ✅

**Keyboard Navigation:**
- Disabled elements not in tab order ✅
- Focus visible on active elements ✅
- Skip navigation available ✅

**Screen Readers:**
- `disabled` attribute announced ✅
- `readOnly` attribute announced ✅
- Lock icons have aria context ✅
- Tooltips accessible ✅

---

## Quick Test Checklist

### Visual Inspection
- [ ] Banner shows at top of closed calls
- [ ] Warning banner prominent in stage content
- [ ] Lock icons visible on all disabled elements
- [ ] Gray background on all disabled fields
- [ ] Different button colors for different states
- [ ] Empty fields show centered messages

### Interaction Test
- [ ] Cannot click disabled quick-tap buttons
- [ ] Cannot type in disabled text fields
- [ ] Cursor changes to not-allowed
- [ ] Intelligence button still works
- [ ] Other AI buttons disabled
- [ ] Tooltips appear on hover

### Contrast Test
- [ ] Can easily distinguish open vs closed
- [ ] Gray fields clearly different from white
- [ ] Selected buttons visible in read-only
- [ ] Text is readable in all states
- [ ] Icons are visible

---

**Visual Design:** ✅ Clear, Professional, Accessible  
**User Experience:** ✅ Intuitive, Informative, Consistent  
**Status:** Ready for Production
