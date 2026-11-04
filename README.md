# Niner Skills Quest

A local demo for selecting completed courses and seeing their suggested skills.
Students can also choose an illustrative career roadmap and Charlotte employer
to define a local career goal. Course and roadmap skills represent possible
exposure or targets, not verified skill mastery.

## Setup

Requires Node.js 22.12+.

```sh
npm install
npm run dev
```

Vite prints a local URL after the development server starts.

## Commands

```sh
npm run build
npm test
```

## Usage

Select **Start local demo** to open the prototype. This is a browser-local demo
session, not identity verification or authentication. Use sample information
only. Sign out to return to the start screen; course and goal data remain in
this browser and are not isolated by a real account.

Record a project, employment, volunteer, or other experience with a title and
one or more supported skills. These skills are explicitly self-reported, not
verified. Edit or remove records at any time; their skills are combined with
course-mapped skills for the goal comparison, and removing one source does not
remove skills still supported by another source. Experiences are stored
separately in browser `localStorage`.

Search the supported demo courses by code or title, choose a result, and select
**Add course**. Remove individual selections at any time. Mapped skills update
immediately, are deduplicated across selected courses, and are derived from
course IDs saved in browser `localStorage`. If browser storage is unavailable or
saved data is invalid, the app displays a message and keeps selections usable for
the current session. The search field, course selector, add button, and labeled
remove buttons work with the keyboard; course and skill updates are announced to
assistive technology. Choose a career roadmap and one of the generic Charlotte
employer profiles in the career goal section. The demo roadmaps are Backend
Developer and Full-stack Developer; the current goal and roadmap skill
targets update immediately and persist in `localStorage`. The roadmap and
employer selectors are keyboard accessible. With a complete goal, the skill
comparison separates target matches across recorded courses and self-reported
experiences from targets not recorded in the inventory. Unmatched targets are
not treated as proof of missing ability. A target skill not recorded in the
inventory can be selected to see a
curated learning resource and a topic to investigate in the official UNC
Charlotte catalog. Catalog topics are suggestions, not confirmed current
elective offerings; check the current catalog and prerequisites.
The optional synthetic transcript sample is parsed in the browser. Review
course candidates and confirm them before import; only confirmed supported
course IDs are saved.

The course-entry screen follows the supplied Figma course panel. In-progress
course status remains outside this completed-course demo.

## Limitations

The course catalog and mappings are illustrative, not official catalog data.
Coursework suggestions are not verified mastery, and roadmap skill targets and
employer profiles are fictional demo data, not verified hiring requirements or
employer endorsements. The demo session does not authenticate users or isolate
one student's data from another. Transcript upload and backend services are not
included. Transcript parsing supports only the bundled synthetic sample format;
do not upload a real transcript or personal information. Cancel or discard a
transcript preview before confirmation to leave saved coursework unchanged.

## AI-use disclosure

GitHub Copilot assisted with the course-entry and career-goal implementation,
tests, and project documentation. Figma MCP was used to access the referenced
design page and export its screenshot; it did not provide inspectable
goal-selection layers, so the career-goal UI follows existing application
patterns and the issue acceptance criteria rather than a verified frame
specification. The team should review the implementation and all illustrative
course mappings, roadmap targets, and employer profiles before treating them as
authoritative. No teammate review or approval is claimed here.