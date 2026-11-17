# Issue #2: Career roadmap and employer goal

## Scope and design notes

Issue #2 lets a student select a supported career roadmap and a Charlotte employer, see both as their current career goal, and change either selection. The implementation is a local demo; employer profiles and skill targets are illustrative, not endorsements or verified hiring requirements.

The issue's Figma file was reachable, but the available design-context request did not expose the selected page layers. The page screenshot could be exported, but its frame details could not be inspected reliably. The goal controls will therefore follow the existing app's compact, labeled form and card patterns rather than claim a verified match to a specific Figma frame.

## Agreed demo choices

- Offer two illustrative roadmaps: Backend Developer and Full-stack Developer.
- Offer generic, clearly labeled demo employer profiles in Charlotte.
- Place goal selection on the existing course-entry page.
- Persist roadmap and employer IDs locally, separately from course selections.
- Include stable roadmap skill IDs for issue #3 to compare with recorded skills.

## Shared target-profile contract

The career-goal store exposes `targetProfile` only after both required selections exist. It contains `roadmapId`, `employerId`, and the selected roadmap's `skillIds`. The roadmaps use shared IDs from the central skill catalog so downstream comparisons can compare IDs instead of labels. Backend Developer targets `java`, `object-oriented-programming`, `api-development`, `database-design`, and `information-security`; Full-stack Developer uses those shared skills plus `web-development` and `agile`.

The current course catalog maps the first two targets and `information-security`; `api-development` and `database-design` are included as target-only demo skills to support a meaningful future gap comparison. These mappings do not prove mastery or absence of skill.

## Implementation and verification

1. Add typed roadmap/employer demo data and the target-profile contract.
2. Add a dedicated persistent career-goal store with validation and recoverable storage messages.
3. Add accessible roadmap/employer selectors, missing-selection prompts, and current-goal/target-skill display to the existing page.
4. Test supported and changed selections, incomplete profiles, persistence and invalid/storage-error recovery; update README and record actual test results.

See [issue-2-test-results.md](./issue-2-test-results.md) for completed validation.
