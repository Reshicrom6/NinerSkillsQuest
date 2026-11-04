# Issue #4: Learning options test results

## Automated checks

- `npm test -- --run tests/learningOptions.test.ts` — passed: 1 file, 2 tests.
- `npm run build` — passed: TypeScript check and Vite production build.
- `git diff --check` — passed.

The curated data test checks that each supported skill has a catalog topic and
at least one HTTPS resource. It also checks that an unsupported skill has no
options so the interface can show its empty state.

## Scope note

UNC Charlotte catalog suggestions are topic searches, not confirmed elective
recommendations. Students must verify current course offerings and
prerequisites in the official catalog. Resources are external and open in a new
tab. Missing skill mappings are not treated as proof of missing ability.
