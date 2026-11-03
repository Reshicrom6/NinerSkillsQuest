# Issue #1: Test results and demonstration evidence

Validation completed for the final milestone on November 3, 2026.

## Automated checks

| Check | Result |
| --- | --- |
| `npm run build` (TypeScript check and Vite production build) | Passed |
| `npm test` | Passed: 2 files, 10 tests |
| `npm audit` | Passed: 0 vulnerabilities |
| `git diff --check` | Passed |

The tests cover unique stable catalog IDs, valid course-to-skill references,
duplicate-add prevention, deduplication and overlap-safe removal, empty mapped
skills, persistence and restore, invalid saved data recovery, and storage read
and write failures.

## Browser demonstration

Ran the app locally with Vite and verified:

- Initial page explains that no courses are selected and no skills are mapped.
- Searching filters by course code/title; a non-matching query shows a helpful message.
- Adding ITCS 2214 immediately shows Java and OOP. The selected course is removed
  from the available options, preventing a duplicate selection.
- Adding ITIS 3200 and ITCS 3155 updates the course count and mapped-skill list.
- Refresh restores selected course IDs from `localStorage`.
- Removing ITCS 2214 removes its Java/OOP skills while the other selected courses
  and their skills remain.
- Adding every supported course reports that all demo courses have been added.
- Invalid JSON in saved course data is ignored and a recoverable status message
  is displayed.
- Keyboard navigation can focus the native course selector, add the selected
  course with Enter, and activate the labeled remove button with Enter. A
  persistent polite live region announces the course and mapped-skill count.

The fixed demo catalog contains three supported courses, each with a mapping, so
the no-courses-selected and all-supported-courses-selected states were exercised
in the browser. The no-mapped-skills state was covered in the store test using a
course with an empty mapping. The no-supported-courses branch is implemented for
an empty catalog but cannot be reached with the current fixed demo catalog.

## Handoff notes

Catalog contents and mappings remain illustrative and must be confirmed against
the official course catalog. The Figma MCP was rate-limited during implementation;
the screenshots supplied for the issue informed the visual direction.
