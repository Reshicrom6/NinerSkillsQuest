# Issue #1: Completed courses

## Design and scope

The initial UI direction comes from the course-entry, project-entry, and imported-course-review screenshots shared for this issue. They use a calm neutral surface, green skill chips, clear course labels, and a purple notice that coursework suggests exposure rather than verified mastery. The Figma MCP could not be used for a live file review because its Starter-plan tool-call limit was reached; the screenshots are the available design reference.

This feature starts with a local demo. Authentication, transcript upload, and backend infrastructure are out of scope.

## Demo catalog and shared data

The initial supported catalog is intentionally small and illustrative, based on the examples in the supplied screenshots. Course-to-skill mappings are suggestions, not official catalog data or verified mastery.

| Course ID | Course | Suggested skill IDs |
| --- | --- | --- |
| `itcs-2214` | ITCS 2214 — Data Structures | `java`, `object-oriented-programming` |
| `itis-3200` | ITIS 3200 — Info Security | `information-security`, `networking` |
| `itcs-3155` | ITCS 3155 — Software Engineering | `agile` |

Skills are defined once with stable IDs in `src/data/catalog.ts`, so the career-goal and skill-gap features can consume the same identifiers. Student selections store course IDs (`completedCourseIds`); the skill inventory will be derived from selected courses and deduplicated by skill ID rather than stored separately.

## Milestones

1. **Complete — Foundation, shared types, and demo catalog** — establish a runnable application shell, basic styling, run/build/test commands, local-demo labeling, shared types, and the initial catalog. This is the first meaningful commit.
2. **Complete — Course workflow and persistence** — add a labeled searchable course selector, add/remove controls, duplicate prevention, immediate mapped-skill updates, overlap-safe derivation, accessible empty states, localStorage persistence with recoverable errors, and shared application state.
3. **Verification and handoff** — cover workflow, derivation, empty-state, accessibility, and refresh-persistence acceptance criteria; record actual outcomes in `docs/issue-1-test-results.md`; complete README setup, usage, limitations, and AI-use disclosure; prepare demonstration evidence.

## Acceptance criteria for the complete feature

- Users can add supported courses once and remove each selected course with a clearly labeled keyboard-accessible control.
- The mapped skill list updates immediately and contains each skill ID only once; removing one course does not remove a skill still supplied by another selected course.
- Empty states explain when no courses are selected, no supported courses are available, or no mapped skills are available.
- Completed course IDs persist across refreshes. Invalid saved values and storage access failures are reported in a recoverable way.
- Shared state exposes completed course IDs/courses and the derived skill list to downstream goal and gap features.
- The UI describes course mappings as suggested exposure, not verified mastery.
