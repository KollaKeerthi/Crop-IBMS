# Crop Data Screenshot Build Notes

## Built from screenshots

- Crop Programs list with create, export, filter, inventory table, row click-through, and record count.
- Crop Data detail header with inventory breadcrumb, crop summary, compact-view label, field/contract metadata, and exact screenshot tab set.
- Program Info, Revenue, Nursery, Planting Data, Production, Pollination, Post Harvest, Seeds Quality, SQ Breakdown, Harvest Details, Media Attachment, and Performance tabs.
- Inline editing remains available through the existing form/table editors.
- Planting Data includes Data and Visual modes, row selection, planted/unplanted toggle, hover detail tooltip, and selected-row inline editing.
- Existing media upload flow is exposed for Nursery, Production, Pollination, and the Media Attachment tab.
- All visible Crop Data labels were cleaned so `NL` and `TZ` are not shown. `Agreed Order From NL (kg)` is now `Agreed Order (kg)`.

## Document items not visible in screenshots

- Current / Submit for Archive / Archive list tabs are described in the pasted document but are not shown in the screenshots.
- Current Working / Pending / Approve status tabs are described in the pasted document but are not shown in the screenshots.
- Submit for Archive and Archive top-right actions are described in the pasted document but are not shown in the screenshots.
- The separate germination-test popup opened from a post-harvest pencil action is described in the pasted document, while the screenshots show the resulting harvest summary area and seed quality screens.
- Block-click creation from a farm layout/calendar screen is described in the pasted document but is outside the Crop Data page screenshots.
- Import/export spreadsheet flows for harvest details are described in the pasted document; the screenshots show the buttons/table state, not the full import workflow.
- A performance graph trigger from the list is described in the pasted document, while the screenshots show the Performance tab table.

## Implementation differences to note

- Save confirmations use the app's existing toast notifications, per instruction.
- Image uploads use the existing crop-data media attachment flow rather than a separate per-tab storage route.
- Crop and block selection continue to load from existing crop masters and location/block hierarchy.
