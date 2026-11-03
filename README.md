# Niner Skills Quest

A local demo for selecting completed courses and seeing their suggested skills.
Coursework suggestions represent possible exposure, not verified skill mastery.

## Setup

Requires Node.js 20.19+ or 22.12+.

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
assistive technology.

## Limitations

The course catalog and mappings are illustrative, not official catalog data.
Coursework suggestions are not verified mastery. Authentication, transcript
upload, and backend services are not included.

## AI-use disclosure

AI assistance was used to scaffold and implement this project. The demo catalog
and course-to-skill mappings are illustrative and should be reviewed against
official course information before being treated as authoritative.