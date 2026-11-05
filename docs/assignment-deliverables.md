# ITSC 3155 Lab Deliverables

This document maps the assignment requirements to the Niner Skills Quest
repository. **Verified** items are supported by repository files, tests, or
Git history. **Add evidence** items require screenshots, URLs, or confirmation
from GitHub, VS Code, Figma, or the team.

## Required links

| Deliverable | Link or evidence |
| --- | --- |
| GitHub repository | [NinerSkillsQuest](https://github.com/kgajula1-stack/NinerSkillsQuest) |
| GitHub Project | https://github.com/users/kgajula1-stack/projects/2 |
| Figma prototype | https://www.figma.com/design/LpfH5WzheMLebrh6dr7jyA/Niner-Skills-Quest?node-id=69-103&t=sW2OVDTOKIzr2C4g-0 |
| Implemented issues | [Issue #1](https://github.com/kgajula1-stack/NinerSkillsQuest/issues/1), [Issue #2](https://github.com/kgajula1-stack/NinerSkillsQuest/issues/2), [Issue #3](https://github.com/kgajula1-stack/NinerSkillsQuest/issues/3) |
| Pull requests | [PR #20](https://github.com/kgajula1-stack/NinerSkillsQuest/pull/20), [PR #21](https://github.com/kgajula1-stack/NinerSkillsQuest/pull/21) |

## Project description and screenshot evidence

**Niner Skills Quest** is a browser-based career-planning application for UNC
Charlotte students. It helps students record completed courses, view skills
associated with those courses, select a career roadmap and Charlotte employer,
and compare recorded course skills with the skills targeted by their career
goal.

The current version is a local demonstration prototype using illustrative
course mappings and fictional employer profiles. Course mappings represent
possible exposure, not verified mastery.

### Feature evidence

- **Local demo access:** [Issue #5 screenshot](./screenshots/issue-5-demo-session.png)
  shows the local demo access screen and Start local demo action.
- **Completed-course workflow:** [Issue #1 screenshot](./screenshots/issue-1-completed-courses.png)
  shows a completed course, mapped Java/OOP skills, and the remove control.
- **Career-goal selection:** [Issue #2 screenshot](./screenshots/issue-2-career-goal.png)
  shows a Backend Developer roadmap, Charlotte employer, target skills, and
  current-goal summary.
- **Skill comparison:** [Issue #3 screenshot](./screenshots/issue-3-skill-comparison.png)
  shows matched skills and target skills not recorded from courses.
- **Empty states and guidance:** [Empty-state screenshot](./screenshots/feature-empty-state.png)
  shows the no-course state and incomplete career-goal prompt.
- **Combined workflow:** [Course and goal screenshot](./screenshots/feature-course-and-goal.png)
  shows course selections, mapped skills, a selected career goal, and the
  comparison section together.

### Main capabilities

- Search, add, and remove completed courses
- Deduplicate skills derived from selected courses
- Persist course and career-goal selections in browser storage
- Select a career roadmap and Charlotte employer
- Compare recorded course skills with target skills
- Provide keyboard-accessible controls and live announcements
- Display recoverable messages for invalid or unavailable browser storage

### Technology and limitations

The project uses TypeScript, Vite, Vitest, vanilla browser DOM APIs, CSS,
`localStorage`, and `sessionStorage`. It does not yet include real
authentication, backend services, transcript uploads, official catalog data,
verified employer requirements, or account-level data isolation.

## 1. GitHub Issues and product backlog

https://github.com/kgajula1-stack/NinerSkillsQuest/issues

Repository planning and verification documents are available for:

- [Completed courses](./issue-1-plan.md)
- [Career roadmap and employer goal](./issue-2-plan.md)
- [Skill comparison](./issue-3-test-results.md)

Verify that each GitHub Issue contains:

- A user story beginning with `As a [role], I want to [what] so that [why].`
- Testable acceptance criteria
- Development, review, and testing tasks
- A `size:small`, `size:medium`, or `size:large` label
- A relevant Figma design link, when applicable
- Inclusion in the GitHub Project

Available evidence:

- [GitHub Issues screenshot](./screenshots/githubIssues.png) shows the
  repository issue list and sizing labels.
- [GitHub Project screenshot](./screenshots/githubProjectboard.png) shows
  Sprint 1 assignments and completed Issues 1–3 in the Done column.

The screenshots show issue labels and project status. Open the individual
issues to verify their full acceptance criteria and development-task text.

## 2. GitHub Copilot access

**Status: Verified.**

The [README](../README.md) includes an AI-use disclosure stating that GitHub
Copilot assisted with implementation, tests, and documentation.

Copilot access and functionality were verified in the development environment.
Add the supporting screenshot to `docs/screenshots/` if the instructor requires
an image artifact.

## 3. VS Code and Copilot setup

**Status: Verified.**

The repository is cloned locally and has a working TypeScript/Vite application.
Setup and verification commands are:

```sh
npm install
npm run dev
npm test
npm run build
```

Technology stack:

- Visual Studio Code
- Git and GitHub
- TypeScript
- Vite
- Vitest
- Vanilla browser DOM APIs
- CSS

VS Code is configured for this repository and GitHub Copilot Chat was verified
by answering a project-structure question about the application.
Add a supporting screenshot to `docs/screenshots/` if the instructor requires
an image artifact.

## 4. Figma MCP integration

**Status: MCP connection authenticated; design-file access still rate-limited.**

Figma design reference: [Niner Skills Quest — node 69:103](https://www.figma.com/design/LpfH5WzheMLebrh6dr7jyA/Niner-Skills-Quest?node-id=69-103&t=sW2OVDTOKIzr2C4g-0)

The current Figma MCP status is authenticated. The health check identifies the
signed-in Figma account, the Starter plan, and Code Layers as enabled. A
follow-up design-context request for file key
`LpfH5WzheMLebrh6dr7jyA` and node `69:103` was blocked by the Figma MCP Starter
plan rate limit, so design context and a Figma screenshot still need to be
retrieved after the limit resets.

Connection: Authenticated
User: Kaushal Gajula
Plan: Starter
Code Layers: Enabled
Design file: LpfH5WzheMLebrh6dr7jyA
Node: 69:103
Design context: Rate limited by Starter plan

The completed-course implementation follows the supplied Figma course panel.
The design informed the compact layout, segmented entry tabs, course preview,
status chips, suggested-skill chips, added-items section, and purple notice.
See [issue-1-plan.md](./issue-1-plan.md).

The career-goal controls follow existing application form and card patterns.
The available Figma design context did not expose reliable inspectable layers,
so the implementation does not claim pixel-perfect alignment with an
unverified frame.

**Add evidence:**

1. Screenshot showing the Figma MCP Server connected in VS Code.
2. Screenshot showing Copilot accessing the relevant Figma frame.
3. Figma frame URL.

## 5. Sprint 1 planning

**Status: Screenshot evidence available; verify live project details.**

Sprint 1 implementation includes:

| Feature | Repository status |
| --- | --- |
| Completed-course entry | Implemented |
| Career roadmap and employer selection | Implemented |
| Course-to-target skill comparison | Implemented |
| Local demo-session gate | Implemented |

The [GitHub Project screenshot](./screenshots/githubProjectboard.png) shows
Sprint 1 on the completed feature cards and the Done column containing the
completed-course, career-goal, and skill-gap issues. The live project should
still be checked for assignees and priorities before submission.

## 6. Functional feature implementation

**Status: Verified in the repository.**

Issue-specific browser evidence:

- [Issue #1 completed-course workflow](./screenshots/issue-1-completed-courses.png)
- [Issue #2 career-goal selection](./screenshots/issue-2-career-goal.png)
- [Issue #3 skill comparison](./screenshots/issue-3-skill-comparison.png)
- [Issue #5 local demo session](./screenshots/issue-5-demo-session.png)

The application allows students to:

1. Start a clearly labeled local demo session.
2. Search the supported course catalog by code or title.
3. Add completed courses and prevent duplicates.
4. Remove selected courses.
5. View deduplicated skills derived from selected courses.
6. Persist course selections in browser `localStorage`.
7. Select a career roadmap and Charlotte employer.
8. View the current goal and roadmap skill targets.
9. Compare course-mapped skills with target skills.
10. Receive recoverable messages for invalid or unavailable browser storage.

Course mappings represent possible exposure, not verified mastery. Skills not
represented by selected courses are labeled “not recorded from courses,” not
proof that the student lacks those skills.

Main implementation files:

- [main.ts](../src/main.ts) — rendering and event handling
- [types.ts](../src/types.ts) — shared domain types
- [catalog.ts](../src/data/catalog.ts) — courses and skills
- [careerGoals.ts](../src/data/careerGoals.ts) — roadmaps and employers
- [skillGap.ts](../src/data/skillGap.ts) — comparison logic
- [courseSelectionStore.ts](../src/state/courseSelectionStore.ts) — course state
- [careerGoalStore.ts](../src/state/careerGoalStore.ts) — career-goal state
- [demoSessionStore.ts](../src/state/demoSessionStore.ts) — demo-session state
- [style.css](../src/style.css) — layout and responsive styling

**Add evidence:** feature branch, at least three meaningful commits, linked
pull request, and merged status.

## 7. Testing and verification

**Status: Verified in the repository; add browser screenshots.**

Run:

```sh
npm install
npm test
npm run build
```

The tests cover catalog integrity, course selection, duplicate prevention,
skill deduplication, persistence, invalid saved data, storage failures,
career-goal selection, target comparison, and demo-session behavior.

Existing verification documents:

- [Course test results](./issue-1-test-results.md)
- [Career-goal test results](./issue-2-test-results.md)
- [Skill-comparison test results](./issue-3-test-results.md)

Automated validation completed on November 4, 2026:

| Check | Result |
| --- | --- |
| `npm test` | Passed: 5 test files, 27 tests |
| `npm run build` | Passed: TypeScript check and Vite production build |

Browser evidence captured from the local Vite application:

- [Empty-state screenshot](./screenshots/feature-empty-state.png) shows the
  local demo, course search, no-course empty state, and incomplete career goal.
- [Course and goal screenshot](./screenshots/feature-course-and-goal.png) shows
  a completed course, mapped skills, selected Full-stack Developer goal,
  selected employer, matched skills, and skills not recorded from courses.

**Add evidence:** terminal screenshot showing the passing commands if your
instructor specifically requires command-line output as an image.

## Demonstration sequence

1. Show the user story and acceptance criteria in GitHub Issues.
2. Show the corresponding Figma frame.
3. Show the issue assigned to Sprint 1.
4. Run the application with `npm run dev`.
5. Start the local demo.
6. Add and remove a supported course.
7. Show the mapped skills.
8. Select a roadmap and employer.
9. Show matched and not-recorded target skills.
10. Show tests, build output, commits, and pull request.
11. Explain how Copilot and Figma MCP supported implementation.

## Screenshot placeholders

Screenshots already captured for the testing evidence:

1. ![Empty-state feature](./screenshots/feature-empty-state.png)
2. ![Course and career-goal comparison](./screenshots/feature-course-and-goal.png)
3. ![Issue 1 completed courses](./screenshots/issue-1-completed-courses.png)
4. ![Issue 2 career goal](./screenshots/issue-2-career-goal.png)
5. ![Issue 3 skill comparison](./screenshots/issue-3-skill-comparison.png)
6. ![Issue 5 demo session](./screenshots/issue-5-demo-session.png)

Add the remaining setup and project screenshots to `docs/screenshots/`:

7. `![VS Code and Copilot](./screenshots/vscode-copilot.png)`
8. `![Figma MCP connection](./screenshots/figma-mcp.png)`
9. `![Figma design context](./screenshots/figma-design-context.png)`
10. `![Sprint 1 Project](./screenshots/sprint-1-project.png)`
11. `![Git history and pull request](./screenshots/git-history.png)`

## Final checklist

- [x] GitHub repository URL included.
- [x] GitHub Project URL included and accessible.
- [x] Figma prototype URL included and accessible.
- [x] Implemented issue links included.
- [x] Pull request links included.
- [x] Copilot access verified.
- [x] VS Code and Copilot verified.
- [ ] Figma MCP evidence attached.
- [x] Sprint 1 Project screenshot attached.
- [x] Working feature implemented.
- [x] Tests and production build documented.
- [x] Browser demonstration screenshots attached.
- [x] README includes setup, usage, testing, limitations, and AI disclosure.
