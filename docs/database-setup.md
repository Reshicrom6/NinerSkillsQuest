# Sprint 2 database setup plan

## Phase 1 status

PostgreSQL with Prisma is implemented. The schema, initial migration, seed
script, and completed-course API are in the repository. The local PostgreSQL
database and a new Supabase development database have both been verified. The
committed migration and illustrative catalog seed are applied in Supabase; an
API smoke test verified add, duplicate and invalid-course rejection, retrieval
after an API restart, removal, and cleanup of its temporary student.

The Supabase verification transferred schema and illustrative seed data only;
it did not copy local course selections. Teammate access remains unverified.
Course data is database-backed when the API is running; career goals and
demo-session state remain browser-local.

## Selected persistence scope

### Persisted reference data

- Courses
- Skills
- Course-to-skill mappings
- Career roadmaps
- Roadmap-to-skill mappings
- Employers
- Learning recommendations

These records are seeded from the existing files in `src/data/`.

### Persisted student data

- Student profile
- Completed course selections
- Current career goal

### Derived data

The application will calculate current skills, matched target skills,
unmatched target skills, and the target skill profile from persisted
relationships. These values will not be stored separately, which avoids
duplicating data that can become inconsistent.

### Session-only data

Search text, draft course selection, selected recommendation UI state,
accessibility announcements, temporary messages, and the local demo sign-in
state are not database entities. The demo sign-in is not real authentication.

## Entity and attribute model

### Student

| Attribute | Type | Constraints |
| --- | --- | --- |
| `id` | UUID or stable string | Primary key |
| `email` | string | Required and unique |
| `displayName` | string | Required |
| `createdAt` | datetime | Required |
| `updatedAt` | datetime | Required |

Real authentication is outside the current sprint scope. This entity provides
ownership for persisted student data.

### Course

| Attribute | Type | Constraints |
| --- | --- | --- |
| `id` | stable string or UUID | Primary key |
| `code` | string | Required and unique |
| `title` | string | Required |
| `createdAt` | datetime | Required |
| `updatedAt` | datetime | Required |

### Skill

| Attribute | Type | Constraints |
| --- | --- | --- |
| `id` | stable string or UUID | Primary key |
| `name` | string | Required and unique |
| `createdAt` | datetime | Required |
| `updatedAt` | datetime | Required |

### CourseSkill

This join entity maps courses to skills. Its composite primary key is
`(courseId, skillId)`, preventing duplicate mappings.

| Attribute | Type | Constraints |
| --- | --- | --- |
| `courseId` | foreign key | References `Course` |
| `skillId` | foreign key | References `Skill` |

### StudentCourse

This join entity records courses completed by a student. Its composite primary
key is `(studentId, courseId)`, preventing duplicate selections.

| Attribute | Type | Constraints |
| --- | --- | --- |
| `studentId` | foreign key | References `Student` |
| `courseId` | foreign key | References `Course` |
| `completedAt` | datetime | Required |
| `createdAt` | datetime | Required |

### CareerRoadmap

| Attribute | Type | Constraints |
| --- | --- | --- |
| `id` | stable string or UUID | Primary key |
| `name` | string | Required and unique |
| `description` | string | Required |
| `createdAt` | datetime | Required |
| `updatedAt` | datetime | Required |

### RoadmapSkill

This join entity maps target skills to a career roadmap. Its composite primary
key is `(roadmapId, skillId)`.

| Attribute | Type | Constraints |
| --- | --- | --- |
| `roadmapId` | foreign key | References `CareerRoadmap` |
| `skillId` | foreign key | References `Skill` |

### Employer

| Attribute | Type | Constraints |
| --- | --- | --- |
| `id` | stable string or UUID | Primary key |
| `name` | string | Required |
| `location` | string | Required |
| `industry` | string | Required |
| `createdAt` | datetime | Required |
| `updatedAt` | datetime | Required |

Employer records are illustrative demo data, not verified endorsements or
hiring requirements.

### StudentCareerGoal

Each student has at most one active goal in the current UI. Therefore,
`studentId` is the primary key for this entity.

| Attribute | Type | Constraints |
| --- | --- | --- |
| `studentId` | foreign key | Primary key; references `Student` |
| `roadmapId` | foreign key | References `CareerRoadmap` |
| `employerId` | foreign key | References `Employer` |
| `createdAt` | datetime | Required |
| `updatedAt` | datetime | Required |

Goal history is out of scope. A future version can add a separate goal ID and
an active/ended status if historical goals become necessary.

### Recommendation

| Attribute | Type | Constraints |
| --- | --- | --- |
| `id` | UUID or stable string | Primary key |
| `skillId` | foreign key | References `Skill` |
| `title` | string | Required |
| `url` | string | Required |
| `type` | string or enum | Required |
| `createdAt` | datetime | Required |

Recommendation types currently represent electives and practice resources.

## Relationships

```text
Student 1 ──── 0..* StudentCourse 0..* ──── 1 Course
Course 1 ──── 0..* CourseSkill 0..* ──── 1 Skill
CareerRoadmap 1 ──── 0..* RoadmapSkill 0..* ──── 1 Skill
Student 1 ──── 0..1 StudentCareerGoal
CareerRoadmap 1 ──── 0..* StudentCareerGoal
Employer 1 ──── 0..* StudentCareerGoal
Skill 1 ──── 0..* Recommendation
```

## Current data-to-entity mapping

| Existing source | Persistence destination |
| --- | --- |
| `skills[]` in `src/data/catalog.ts` | `Skill` |
| `courses[]` in `src/data/catalog.ts` | `Course` |
| `course.skillIds[]` | `CourseSkill` |
| `careerRoadmaps[]` in `src/data/careerGoals.ts` | `CareerRoadmap` |
| `roadmap.skillIds[]` | `RoadmapSkill` |
| `employerProfiles[]` in `src/data/careerGoals.ts` | `Employer` |
| Recommendation data in `src/data/recommendations.ts` | `Recommendation` |
| `completedCourseIds` in `courseSelectionStore.ts` | `StudentCourse` |
| Selected roadmap and employer IDs | `StudentCareerGoal` |
| `targetProfile` and skill comparison results | Derived query results |

Stable IDs already used by the catalog, such as `backend-developer`, should
remain unchanged when the seed data is created.

## Integrity and deletion rules

- Deleting a student cascades to that student's `StudentCourse` and
  `StudentCareerGoal` records.
- Deleting a course, skill, roadmap, or employer is restricted when dependent
  records exist.
- Course-skill and roadmap-skill mappings may be changed only as intentional
  catalog maintenance.
- Reference records should normally be updated or retired rather than
  casually deleted.
- Foreign keys and unique constraints must be enforced by the database, not
  only by the UI.

## First database-integrated user story

> As a student, I want to save completed courses so that my selected courses
> and mapped skills remain available after restarting the application.

Acceptance criteria:

1. A valid course can be saved for a student.
2. The selection is stored in `StudentCourse`.
3. A duplicate course cannot be selected twice for the same student.
4. Saved courses can be retrieved after restarting the application.
5. Course skills are loaded through `CourseSkill`.
6. Removing a course changes only that student's selection.
7. An unknown course ID is rejected.
8. Database failures produce a visible error message.

## Team verification table

Record only operations actually performed by each member. Do not include
credentials or private connection strings.

| Team member | Operation | Result |
| --- | --- | --- |
| Kaushal Gajula (local environment) | Migration status, seed, API add, duplicate and invalid-course rejection, API restart/retrieve, remove | Passed |
| Kaushal Gajula (Supabase development project) | Applied migration and seed; API add, duplicate and invalid-course rejection, API restart/retrieve, remove, temporary-student cleanup | Passed |
| Teammate 2 | Pending individual verification | Pending |
| Teammate 3 | Pending individual verification | Pending |

## Database choice

The team selected PostgreSQL with Prisma because the application has normalized
relationships between students, courses, skills, roadmaps, employers, and
recommendations. PostgreSQL provides foreign keys and composite constraints,
while Prisma provides typed access, migration files, and a reproducible seed
workflow.

The verified configurations include local PostgreSQL and a Supabase
development project. Team agreement and other members' access are still
pending. Keep connection credentials in each member's local `.env` file and
never commit or post them.

## Teammate installation and local setup

These steps create the same database structure and seed data on each
teammate's computer. They do not give a teammate access to the PostgreSQL
server running on another computer.

### 1. Install prerequisites

Install Node.js 22.12 or newer, Git, and PostgreSQL 17. On Windows,
PostgreSQL can be installed with:

```powershell
winget install --id PostgreSQL.PostgreSQL.17 --exact `
  --accept-package-agreements --accept-source-agreements
```

During PostgreSQL installation, each teammate must choose and remember a local
password for the `postgres` user. The password may be different on each
computer.

Confirm that the PostgreSQL service is running:

```powershell
Get-Service -Name postgresql-x64-17
```

Confirm the command-line client is available:

```powershell
psql --version
```

### 2. Clone and install the project

```powershell
git clone https://github.com/kgajula1-stack/NinerSkillsQuest.git
cd NinerSkillsQuest
npm install
```

### 3. Create a local database

Set `PGPASSWORD` only for the current PowerShell session and replace the
placeholder with the password selected during PostgreSQL installation:

```powershell
$env:PGPASSWORD="your-local-postgres-password"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" `
  -h localhost -U postgres -d postgres `
  -c "CREATE DATABASE niner_skills_quest;"
```

If the database already exists, PostgreSQL will report that it exists; this is
safe to ignore.

### 4. Configure the local environment

Copy `.env.example` to `.env` and replace the password placeholder:

```powershell
Copy-Item .env.example .env
```

The local file should contain a connection string in this format:

```env
DATABASE_URL="postgresql://postgres:your-local-postgres-password@localhost:5432/niner_skills_quest"
```

Never commit `.env`, paste its contents into an issue, or include it in a
screenshot. Verify that Git ignores it:

```powershell
git check-ignore -v .env
git ls-files .env
```

The first command should show the `.gitignore` rule. The second command should
produce no output.

### 5. Generate and initialize Prisma

Run the following commands from the repository root:

```powershell
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run build
```

`npm run db:migrate` applies the committed Prisma migrations. The seed command
loads the illustrative catalog, roadmap, employer, and recommendation data.
The seed is repeatable and uses upserts for reference records.

### 6. Verify access

Check the database through the PostgreSQL CLI:

```powershell
$env:PGPASSWORD="your-local-postgres-password"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" `
  -h localhost -U postgres -d niner_skills_quest `
  -c "\dt"
```

Or open Prisma Studio:

```powershell
npm run db:studio
```

Open [http://localhost:5555](http://localhost:5555), then stop Prisma Studio
with `Ctrl+C` when finished.

### 7. Run the database-backed course workflow

Start the API and frontend in separate terminals:

```powershell
# Terminal 1
npm run dev:api

# Terminal 2
npm run dev
```

Open the Vite URL printed in Terminal 2. The completed-course workflow now
loads, adds, and removes selections through the Prisma API and PostgreSQL.
The API validates unknown course IDs and returns a conflict for duplicate
selections. The browser does not connect directly to PostgreSQL.

### Run the database API integration test

Set `DATABASE_URL_TEST` in the current shell to a migrated and seeded
PostgreSQL test database, then run:

```powershell
npm run test:db
```

The test creates a uniquely identified temporary student, exercises the
completed-course API, restarts the API server to verify persistence, and
deletes that student in cleanup. It requires the seeded `itcs-2214` course.
Use a test database, not a shared or production database. The recorded local
verification used the existing local PostgreSQL database and cleaned up its
temporary student; a separate test database is recommended for repeated or
team runs.

## Supabase development database

A Supabase PostgreSQL development project has been configured using the direct
connection option from the dashboard's **Connect** dialog. The initial Prisma
migration and illustrative seed data are applied. The seed includes a demo
student and catalog/reference records; no local course selections were
transferred.

To connect the API to Supabase, set `DATABASE_URL` in the local, ignored
`.env` to the connection string copied from Supabase. Do not paste the actual
URL or password into source files, issues, screenshots, or chat. Preserve the
local database URL separately if you still need to switch back to local
PostgreSQL. Direct connections may require IPv6; if a teammate cannot connect,
select the Session pooler in the Supabase dashboard and use its connection
string instead.

For a new deployment of committed migrations to the hosted development
database, run:

```powershell
npm run db:migrate:deploy
```

Seed only illustrative records with:

```powershell
npm run db:seed
```

The seed refreshes course-skill and roadmap-skill mappings for the seeded
catalog. Do not rerun it if those mappings have been intentionally edited in
Supabase.

## Teammate connection options

The Supabase development project is available as the potential shared
PostgreSQL environment, but each teammate's access still needs to be verified.
Share the connection string only through an approved secure channel; each
teammate stores it in their own ignored `.env`.

Alternatively, a teammate can use a separate local PostgreSQL database and
apply the same committed migrations and seed script. `localhost` always means
the computer running the command and does not connect to another teammate's
local server.

Do not expose a home computer's PostgreSQL port to the public internet. Do not
commit a shared connection string, password, private key, or service-account
credential. When documenting a provider, include only the provider, database
name, non-secret variable names, and connection procedure here; distribute
actual secrets separately.

## Prisma workflow for schema changes

When the schema changes:

```powershell
npm run db:migrate -- --name describe-your-change
npm run db:generate
npm run db:seed
```

Commit `prisma/schema.prisma` and the new `prisma/migrations/` directory.
For the hosted Supabase development database, apply already-committed
migrations with `npm run db:migrate:deploy`. Teammates then pull the changes
and apply them to their own local database with:

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

Do not edit an existing migration that has already been applied. Create a new
migration for each schema change.
