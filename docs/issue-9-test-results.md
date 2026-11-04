# Issue #9 test results

## Automated checks

- `npm test -- --run`: passed; 9 test files and 44 tests.
- `npm run build`: passed; TypeScript check and Vite production build completed.
- `git diff --check`: passed.

## Browser checks

Using the local Vite app at `http://127.0.0.1:5173/`:

- Selected InfoSec as an unmatched target and saw a sample course, project
  idea, and practice resource, each labeled with its type and associated skill.
- The course recommendation showed both mapped skills, InfoSec and Networking,
  while remaining one deduplicated itinerary activity.
- Saved all three types. The course and practice resource had links; the project
  idea clearly indicated that no resource link was provided.
- Confirmed saved recommendations were disabled to prevent duplicate saves and
  that adding a project announced success through the live status region.
- Reloaded the page and confirmed all three activities returned with their
  links and metadata.
- Removed the project idea, reloaded again, and confirmed the course and
  practice resource remained while the project stayed removed.

The itinerary is persisted in browser `localStorage` for this anonymous demo.
No authenticated account or cross-device persistence is implemented.
