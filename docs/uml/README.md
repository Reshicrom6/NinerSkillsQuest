# UML diagrams

The PlantUML sources and rendered SVGs in this directory describe the Prisma
data model and the database-backed completed-course flow.

Files:

- `class-diagram.puml` and `class-diagram.svg`
- `sequence-course-save.puml` and `sequence-course-save.svg`

The sequence diagram follows the tested UI/store, Node API, Prisma, and
PostgreSQL flow, including invalid and duplicate course handling, retrieval
after an API restart, and removal. Rendered with PlantUML's Smetana layout.
