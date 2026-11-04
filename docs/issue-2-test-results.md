# Issue #2: Test results

Validation completed on November 4, 2026.

## Automated checks

| Check | Result |
| --- | --- |
| `npm test` | Passed: 3 files, 18 tests |
| `npm run build` | Passed: TypeScript check and Vite production build |
| `git diff --check` | Passed |

Career-goal store tests cover an incomplete initial goal, supported roadmap and
employer selection, switching either choice, clearing a required choice,
`targetProfile` skill IDs, persistence and restore, invalid saved values, and
storage read/write failures. Catalog tests verify unique roadmap IDs and valid,
shared roadmap skill IDs.

## Browser checks

- Initial page prompts the student to choose both a roadmap and Charlotte employer.
- Choosing Backend Developer alone prompts for an employer.
- Choosing a demo employer displays the current goal, employer industry and
  Charlotte location, and the roadmap's target skill chips.
- Changing employers updates the current goal summary.
- Switching from Backend Developer to Full-stack Developer updates the current
  goal and its skill targets while retaining the selected employer.
- Clearing the roadmap removes the completed goal and prompts the student to
  select a roadmap.
- At a 320px viewport, `document.scrollWidth` and `document.clientWidth` were
  both 305px; no horizontal overflow or horizontal scrollbar remained.

## Scope note

Employer profiles and target skills are illustrative local-demo data, not
verified employer requirements or endorsements. The Figma file was reachable,
but its goal-frame layers could not be inspected with the available design
context; the implementation follows existing app patterns rather than claiming
pixel-level alignment with an unverified frame.
