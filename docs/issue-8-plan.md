# Issue #8: Custom experience implementation plan

## Requirement

Let a student record a project or other experience with a title, type, and at
least one supported skill; identify it as self-reported; and edit or remove it
without losing skills supported by another source.

## Existing architecture

- `CourseSelectionStore` owns course IDs and derives course-mapped skills.
- `CareerGoalStore` owns the selected goal and persists independently.
- The skill comparison consumes derived skill IDs from existing sources.
- The UI is a single local demo page with store subscriptions and Vitest coverage.

## Alternatives considered

1. **Add experience records to `CourseSelectionStore`.** This would combine
   different source lifecycles and require changing the course storage schema,
   validation, and existing tests.
2. **Create a dedicated `ExperienceStore` and combine skills at the inventory
   boundary.** This keeps course behavior stable, makes experience CRUD and
   source attribution explicit, and lets the comparison deduplicate skills
   across independent sources.
3. **Replace all source stores with a generalized inventory framework.** This
   could simplify future sources, but is a larger refactor with no need for the
   current feature.

## Selected plan

Use alternative 2. Add a typed experience record, explicit title/type/skill
validation, an independent local persistence key, and add/edit/remove methods.
Derive experience skills uniquely from the active records; combine them with
course-derived skills only when rendering inventory and calculating skill
matches. Keep source records separate so removing one experience cannot erase a
skill still provided by a course or another experience.

Add a compact accessible form with required-field errors, supported-skill
checkboxes, edit/remove controls, and a visible “Self-reported” source label.
Do not present self-reported skills as verified mastery.

## Verification

- Unit tests: required-field validation, supported skills, create/edit/remove,
  persistence restore and storage failures, deduplication across overlapping
  sources, and preserving skills after one source is removed.
- UI check: add an experience, edit it, remove it, and verify skill comparison
  updates while overlapping course/experience evidence remains.
- Run the focused tests, full build, and `git diff --check`.

## Scope and limitations

This is browser-local demo persistence, not account-backed storage. The feature
does not verify that a self-reported experience or skill is true.
