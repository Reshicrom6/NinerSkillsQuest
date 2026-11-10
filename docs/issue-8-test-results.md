# Issue #8 test results

## Automated checks

- `npm test -- --run`: passed; 8 test files and 38 tests.
- `npm run build`: passed; TypeScript check and Vite production build completed.
- `git diff --check`: passed.

## Browser checks

Using the local Vite app at `http://127.0.0.1:5173/`:

- Added a titled Project experience with a selected skill; the record appeared
  with a visible “Self-reported” label.
- Edited the record's title, type, and skills; the skill comparison updated.
- Removed the record; the comparison returned to course-derived skills.
- Added an experience containing Java (also provided by the selected course)
  and API Development, then removed it. Java and OOP remained matched from the
  course, while API Development returned to the unrecorded target list.

The store tests also cover validation, persistence restore and storage errors,
edits, removals, and skill deduplication. Self-reported skills are not verified
mastery.
