# Issue #9: Personalized career itinerary plan

## Requirement

Let a student save recommended courses, projects, and practice resources; see
each saved activity's name, type, associated skill, and available link; remove
activities; prevent duplicate saves; and restore the itinerary after returning
to the dashboard or refreshing. Saving must report success or an actionable
failure.

## Existing architecture

- The app is a local demo with independent localStorage-backed stores for
  completed courses, the career goal, and custom experiences.
- Supported courses and skills are defined in `src/data/catalog.ts`.
- Skill-specific practice resources are defined in
  `src/data/learningOptions.ts`.
- The app has no authenticated account identity; browser storage is shared by
  this local demo profile.
- Figma MCP metadata access was attempted for the issue's design reference but
  is currently blocked by the Figma Starter-plan tool-call limit. Use existing
  application patterns and the issue criteria without claiming frame-level
  design verification.

## Alternatives considered

1. **Append saved IDs to the course or learning-options stores.** This would
   couple itinerary lifecycle to source-specific data and make projects and
   future activity types awkward to represent.
2. **Add a dedicated itinerary store backed by a typed, curated activity
   catalog.** Store stable activity IDs, derive display details from one
   catalog, and keep source-specific recommendation generation separate. This
   supports all required activity types, deduplication, validation, and refresh
   recovery without changing completed-course or goal data.
3. **Persist complete activity snapshots directly from the UI.** This is
   flexible, but duplicates labels and URLs in storage, permits stale or
   untrusted links, and makes catalog updates harder to validate.

## Selected plan

Use alternative 2. Add a typed activity catalog for the demo's course,
project, and practice-resource recommendations, plus a dedicated
`ItineraryStore` that persists unique activity IDs under its own storage key.
Validate restored IDs against the current catalog; expose add/remove actions,
subscription updates, and explicit status messages for success, duplicate
selection, invalid activity, and browser-storage failures.

Show recommendations from existing supported courses and learning resources,
with a small, clearly illustrative project-idea set. Add an itinerary section
to the dashboard that displays each saved activity's name, type, associated
skill, and link when available. Do not mix itinerary saves with completed
course records. Clearly label catalog/course data as illustrative and link to
the official catalog only as a place to verify current offerings.

Because the prototype has no real authentication, persistence can only be
verified for this browser's local demo profile. Do not imply account isolation
or multi-device synchronization; make this boundary visible in the UI and
README.

## Verification

- Unit tests: supported/unsupported activity validation, add/remove,
  duplicate-safe saves, storage restore, malformed stored IDs, and storage
  failures.
- UI checks: save one activity of each supported type, verify displayed
  metadata and link, reject duplicate saves, remove an activity, and refresh to
  confirm the remaining itinerary is restored.
- Run the focused and full Vitest suites, production build, and
  `git diff --check`.
- Record observed results in `docs/issue-9-test-results.md`.

## Scope and limitations

This is browser-local persistence for the anonymous demo, not
account-backed storage. Recommendations are curated sample data, not official
course offerings or verified project requirements.
