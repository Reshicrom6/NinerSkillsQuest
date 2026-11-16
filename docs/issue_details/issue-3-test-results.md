# Issue #3: Skill comparison test results

## Automated checks

- `npm test -- --run tests/skillGap.test.ts` — passed: 1 file, 4 tests.
- `npm run build` — passed: TypeScript check and Vite production build.
- `git diff --check` — passed.

The comparison tests cover matched and unmatched target skills, duplicate
evidence and target IDs, updates when the inventory or goal changes, missing
goals, and empty target sets.

## Scope note

The comparison uses course-derived skills available in this local demo. A target
skill not represented by a course mapping is labeled “not recorded from courses”
and is not treated as evidence that the student lacks that skill. The UI shows
guidance when the career goal is incomplete.
