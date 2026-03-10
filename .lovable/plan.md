

# Fix: Date Picker Stuck in PCP Registration Modal

## Problem
The Calendar date picker inside the `HistoricoProducaoModal` dialog doesn't work properly -- clicking dates or navigating months closes the popover or doesn't register clicks. This is the known Radix UI conflict between Dialog and Popover components.

## Solution
Apply the same fix already used elsewhere in the project (per memory context): add `z-[100]`, `pointer-events-auto`, and `onInteractOutside` to the PopoverContent.

## Change in `src/components/pcp/HistoricoProducaoModal.tsx`

**Line 210** -- Update the PopoverContent:
```tsx
// Before
<PopoverContent className="w-auto p-0">
  <Calendar ... />

// After
<PopoverContent 
  className="w-auto p-0 z-[100] pointer-events-auto" 
  onInteractOutside={(e) => e.stopPropagation()}
>
  <Calendar ... />
```

Single line change, consistent with the pattern already used in AgendamentoEditModal, ReagendamentoDialog, etc.

