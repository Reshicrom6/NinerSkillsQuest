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
employer selectors are keyboard accessible.

The course-entry screen follows the supplied Figma course panel. The project or
experience tab and in-progress status are shown only as disabled visual context;
this feature handles completed courses only.

## Limitations

The course catalog and mappings are illustrative, not official catalog data.
Coursework suggestions are not verified mastery, and roadmap skill targets and
employer profiles are fictional demo data, not verified hiring requirements or
employer endorsements. Authentication, transcript upload, and backend services
are not included.

## AI-use disclosure

GitHub Copilot assisted with the course-entry and career-goal implementation,
tests, and project documentation. Figma MCP was used to access the referenced
design page and export its screenshot; it did not provide inspectable
goal-selection layers, so the career-goal UI follows existing application
patterns and the issue acceptance criteria rather than a verified frame
specification. The team should review the implementation and all illustrative
course mappings, roadmap targets, and employer profiles before treating them as
authoritative. No teammate review or approval is claimed here.