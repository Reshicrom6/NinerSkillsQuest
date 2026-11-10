# Issue #6: Transcript review test results

## Automated checks

- `npm test -- --run tests/transcript.test.ts tests/courseSelectionStore.test.ts` — passed.
- `npm run build` — passed: TypeScript check and Vite production build.
- `git diff --check` — passed.

Tests cover supported completed-course candidates, failed/in-progress/
incomplete/withdrawn and unsupported courses, empty and unsupported files, and
adding confirmed course IDs without duplicates.

## Browser demonstration

Loaded `public/synthetic-transcript.pdf` in the local app. The preview identified
ITCS 2214 with grade A as a selectable candidate, excluded ITIS 3200 marked IP,
and excluded unsupported ITCS 9999. Confirming added only ITCS 2214 to the
course list. The initial preview did not change saved coursework.

## Scope note

This is a local synthetic demo; it does not read a real student transcript
format. The file is parsed in the browser, and only confirmed supported course
IDs are written to the existing browser course list. Review the privacy
behavior and disclosure in issue #7 before using real student information.
