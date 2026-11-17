# Sprint 2 AI design review

## Scope reviewed

The current Sprint 1 application was reviewed against the existing user
stories, Figma MCP context, source tree, and tests. The application is a Vite
and vanilla TypeScript browser demo.

Known implemented concepts include:

- Completed-course search, selection, duplicate prevention, removal, and
  mapped-skill display from Issue #1.
- Career roadmap and Charlotte employer selection with persistence from Issue
  #2.
- Recorded-skill and target-skill comparison from Issue #3.
- Learning recommendations for an unrecorded target skill from Issue #4.
- A clearly labeled local demo session rather than real authentication.

## Reviewed design decisions

- Course, skill, roadmap, employer, and recommendation catalogs are reference
  records loaded by the Prisma seed.
- Student profiles, completed courses, and the current career goal are
  modeled as student-owned persisted data. The current course API persists
  completed courses; career-goal persistence remains browser-local.
- Current skills, target profiles, and skill-gap results are derived from
  relationship queries rather than stored redundantly.
- Course persistence is separated from render logic through the course
  selection store and Node API.
- The local demo session is not verified university authentication and will
  remain outside the persistent domain model.
- The current UI supports one active career goal per student, so
  `StudentCareerGoal.studentId` is its primary key.
- Composite keys on `StudentCourse`, `CourseSkill`, and `RoadmapSkill` prevent
  duplicate relationships.

## AI-generated design decision reviewed and corrected

The initial design represented roadmap skill IDs as an array directly on a
roadmap record. The team corrected this to a normalized `RoadmapSkill` join
entity.

The corrected design allows a skill to belong to multiple roadmaps, enforces
foreign-key integrity, prevents duplicate roadmap-skill mappings, and supports
relationship queries without storing a serialized array. The same normalized
approach is used for course-to-skill mappings and student course selections.

## Implementation review

The project uses PostgreSQL with Prisma. The schema and initial migration are
in `prisma/`; reference data is populated by `prisma/seed.ts`. The completed
course API validates course IDs, relies on the composite student-course key to
reject duplicates, and returns persisted selections with mapped skills.
The database integration test verifies add, duplicate rejection, invalid
course rejection, retrieval after restarting the API, and removal using a
temporary test student.

The UML class and sequence diagrams are available as PlantUML sources and
rendered SVGs in `docs/uml/`.

## Remaining team decisions

- Whether to configure a shared team development database; the current
  verified connection is local.
- How to demonstrate every teammate's database connectivity and contribution.
- Whether to persist career goals through the API in a future feature.

The API uses a fixed demo student ID and is not authentication or account
isolation. Do not use it with real student data.
