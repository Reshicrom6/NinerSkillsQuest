# Sprint 2 Deliverables

This is the Sprint 2 status and evidence index for Niner Skills Quest. It is
separate from the Sprint 1 team deliverables document.

## Overall completion snapshot

**Last updated: November 15, 2026**

The implementation and local verification work is substantially complete, but
the Sprint 2 submission is not complete yet.

| Area | Current status |
| --- | --- |
| Database-backed course feature, schema, migration, seed, local and Supabase verification | Complete |
| UML sources and rendered diagrams | Complete |
| Unit tests, database API integration test, lint, and production build | Complete |
| Credential ignore rules and placeholder environment file | Complete |
| Supabase project configured; teammate access and contributions | In progress |
| GitHub issue/project evidence review | In progress |
| Sprint 2 release | Pending |
| Dependency audit findings | Needs review before release |

Figma MCP evidence is treated as accepted based on the student's confirmation.
No score prediction is made here; the instructor determines grading.

## Status key

- **Complete**: artifact is present and/or local verification passed.
- **In progress**: implementation exists, but team evidence or further review is
  still needed.
- **Pending**: deliverable has not been completed or verified.

## Part 1: ORM and UML

| Requirement | Status | Evidence |
| --- | --- | --- |
| Analyze application data and relationships | Complete | [AI design review](./ai-design-review.md); [Prisma schema](../prisma/schema.prisma) |
| Generate ORM schema, migration, and seed | Complete | [Prisma schema](../prisma/schema.prisma); [migration](../prisma/migrations/20261112200023_init/migration.sql); [seed](../prisma/seed.ts) |
| Review an AI-generated data-model decision | Complete | [AI design review](./ai-design-review.md) explains the normalized `RoadmapSkill` join entity |
| UML class diagram source and rendered image | Complete | [Class diagram source](./uml/class-diagram.puml); [class diagram SVG](./uml/class-diagram.svg) |
| UML sequence diagram source and rendered image | Complete | [Sequence source](./uml/sequence-course-save.puml); [sequence SVG](./uml/sequence-course-save.svg) |

The sequence diagram represents the implemented course-selection UI/store,
Node API, Prisma, and PostgreSQL flow, including invalid and duplicate
selection handling, retrieval after an API restart, and removal.

## Part 2: Database selection and configuration

| Requirement | Status | Evidence |
| --- | --- | --- |
| Select and justify database/ORM | Complete | PostgreSQL and Prisma are documented in [database setup](./database-setup.md) |
| Configure schema and migrations | Complete | Prisma schema and initial migration are committed |
| Seed development data | Complete | `npm run db:seed` completed for local PostgreSQL and Supabase |
| Verify local and hosted database connections | Complete | Local PostgreSQL and Supabase connections succeeded |
| Document setup and run instructions | Complete | [Database setup](./database-setup.md) |

The committed migration was deployed to the new Supabase project, then the
illustrative seed completed. The local PostgreSQL database remains available.
Only schema and sample seed data were transferred, not local course
selections.

## Part 3: Team database collaboration

| Requirement | Status | Evidence / next action |
| --- | --- | --- |
| Agree on shared or consistent local database setup | In progress | Supabase project is configured; confirm the team will use it as the shared development database |
| Verify each teammate can connect and perform database operations | In progress | The [database verification table](./database-setup.md) records owner verification; other members remain pending |

Do not record teammate connectivity or test results unless that teammate
actually performed the verification. Ask the instructor about an approved
alternative if the team cannot complete its shared requirements.

## Part 4: Credential protection

| Requirement | Status | Evidence |
| --- | --- | --- |
| Ignore local environment files and secrets | Complete | [`.gitignore`](../.gitignore) |
| Provide placeholder configuration | Complete | [`.env.example`](../.env.example) |
| Verify local `.env` is ignored and not tracked | Complete | Verified with `git check-ignore` and `git ls-files`; no credential values are included here |
| Document secure setup | Complete | [Database setup](./database-setup.md) |

## Part 5: Database-integrated user story

| Requirement | Status | Evidence / next action |
| --- | --- | --- |
| Implement completed-course persistence through Prisma API | Complete | [Course API](../server/api.mjs); [course-selection store](../src/state/courseSelectionStore.ts) |
| Validate successful and invalid/duplicate operations | Complete | [Database API integration test](../tests/apiDatabase.integration.mjs) |
| Verify add, API restart/retrieve, and remove | Complete | Local integration test and Supabase smoke test passed using temporary students that were cleaned up |
| Link the work to a Sprint 2 issue with matching acceptance criteria | In progress | Confirm the selected GitHub issue explicitly requires database persistence and restart behavior |

The API uses a fixed demo student ID and is not authentication or account
isolation. Do not use it with real student data.

## Part 6: Team contributions and Scrum

| Requirement | Status | Evidence / next action |
| --- | --- | --- |
| Each member makes a meaningful Sprint 2 commit | In progress | Existing Sprint 2 commits are present for the repository owner; verify every teammate's own contribution |
| Issues and Project board reflect Sprint 2 work | In progress | Review assignees, acceptance criteria, statuses, and linked commits/PRs on GitHub |

Local changes that have not been committed do not count as submitted commit
evidence. Do not create commits under another member's identity.

## Part 7: Automated tests and code quality

| Check | Status | Result |
| --- | --- | --- |
| Unit tests: `npm test` | Complete | Passed: 34 tests across 8 files |
| Database API test: `npm run test:db` | Complete | Passed: add, duplicate rejection, invalid-course rejection, API restart/retrieve, remove, and missing-selection rejection |
| Lint: `npm run lint` | Complete | Passed |
| Production build: `npm run build` | Complete | Passed: TypeScript check and Vite production build |

`DATABASE_URL_TEST` should point to a dedicated local test database for
repeatable runs. Do not run `npm run test:db` against the shared Supabase
database; the separate Supabase smoke test used a temporary student and
removed it during cleanup.

## Part 8: Sprint 2 release

| Requirement | Status | Next action |
| --- | --- | --- |
| Create a Sprint 2 tag and GitHub release | Pending | Confirm no release already exists, then create the tag/release after final checks |
| Summarize stories, database status, tests, limitations, and run instructions | Pending | Include these details in the release notes |
| Ensure release matches submitted implementation | Pending | Tag the final tested commit |

No local Sprint 2 release tag was found during the repository check. Remote
GitHub release status has not been verified.

## Known issue to review before release

`npm audit` reported 10 vulnerabilities: 7 moderate and 3 high. The high
findings include the existing Prisma 6 dependency; the reported Prisma fix
requires a major-version upgrade. No Prisma major upgrade was performed as
part of this Sprint 2 work.
