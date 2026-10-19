# Z-Index Scale Documentation

This document defines the z-index scale used throughout the AI Cold-Call Assistant frontend to prevent stacking context conflicts.

## Scale

| Range | Purpose | Examples |
|-------|---------|----------|
| `0-9` | Base layer | Page content, cards, panels |
| `10-19` | Elevated elements | Dropdowns, tooltips, popovers |
| `20-29` | Sticky elements | Sticky headers, floating action buttons |
| `30-39` | Overlays (low) | Loading overlays, temporary banners |
| `40-49` | Modals (standard) | Confirmation dialogs, input modals |
| `50-59` | Modals (high priority) | **Current modals use z-50** (AIActionsPanel analyze/stage modals) |
| `60-69` | Toast notifications | Success/error toasts that should appear above modals |
| `70-79` | Critical alerts | System-level warnings, critical errors |
| `80-89` | Context menus | Right-click menus, command palettes |
| `90-99` | Maximum priority | Emergency UI, tour guides, onboarding overlays |

## Current Usage

### Modals (z-50)
- **AIActionsPanel.tsx** - Analyze Transcript modal
- **AIActionsPanel.tsx** - Suggest Next Stage modal

These modals use `z-50` and overlay the viewport with `bg-black bg-opacity-50`.

### Future Considerations
- If adding dropdowns or tooltips, use z-10 to z-19
- If adding toast notifications, use z-60 to z-69 (above modals)
- If adding a context menu or command palette, use z-80 to z-89

## Guidelines

1. **Use Tailwind's built-in z-index utilities** when possible:
   - `z-0` = 0
   - `z-10` = 10
   - `z-20` = 20
   - `z-30` = 30
   - `z-40` = 40
   - `z-50` = 50
   - `z-auto` = auto

2. **Custom z-index values** should be added to `tailwind.config.js` and documented here.

3. **When adding new UI elements**, check this scale first to determine the appropriate z-index range.

4. **Avoid arbitrary values** like `z-[999]` unless absolutely necessary for third-party library compatibility.

5. **Test stacking contexts** by opening multiple overlays simultaneously (modal + dropdown, modal + toast, etc.).

## Testing Checklist

When adding new overlays or elevated elements, test:

- [ ] Element appears above base content
- [ ] Element appears in correct order relative to other overlays
- [ ] Element does not conflict with modals when both are open
- [ ] Element does not conflict with toast notifications
- [ ] Element backdrop (if any) covers the correct layers

## Related Files

- `frontend/src/components/AIActionsPanel.tsx` - Contains modals using z-50
- `tailwind.config.js` - Tailwind configuration (extend z-index if needed)

## Last Updated

2025-01-27 - Initial documentation created during browser-prompt fix implementation
