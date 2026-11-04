# Issue #7: Transcript privacy verification

## Evidence

- The privacy notice is rendered before the file picker, drop zone, or sample
  PDF action.
- Transcript parsing is client-side. The parser destroys its PDF.js loading task,
  removes its abort listener, and clears its application-owned input byte buffer
  in `finally`.
- The review UI retains only candidate course codes, supported course IDs,
  grades, and titles in memory. Discard and cancel clear the preview and abort
  active parsing.
- `CourseSelectionStore.addCourses` persists only deduplicated confirmed course
  IDs. The test asserts the serialized storage value contains IDs and not course
  titles.
- `npm test -- --run tests/transcript.test.ts tests/courseSelectionStore.test.ts`
  — passed.
- `npm run build` — passed.

## Limitations

The app has no backend, database, analytics, or application logging service.
Browser storage still retains confirmed course IDs. There is no account-level
identity isolation, and this feature must not be used with real student
transcripts. The demo privacy notice and README disclose this scope.
