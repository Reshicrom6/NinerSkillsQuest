# Issue #4: Missing-skill recommendations

## Design and scope

This feature lets a student choose a missing skill from the current skill-gap comparison and explore relevant UNC Charlotte elective and practice-resource recommendations. The goal is to turn a gap into actionable next steps without suggesting that the app verifies mastery or enrollment eligibility.

The design follows the supplied Figma recommendation panel pattern and the current local-demo workflow: course entry → career goal → skill-gap comparison → missing-skill recommendations. The feature starts with curated demo content for a small set of missing skills and is intended to be illustrative rather than authoritative university guidance.

This feature focuses on local demo recommendations only. Authentication, transcript parsing, itinerary generation, and backend infrastructure remain out of scope.

## Demo catalog and curated recommendations

The initial recommendation catalog is intentionally small and illustrative, based on the missing skills surfaced by the demo skill-gap comparison. Each skill may map to one or more UNC Charlotte electives and one or more online practice resources.

| Missing skill | Relevant UNC Charlotte electives | Suggested practice resources |
| --- | --- | --- |
| `java` | ITCS 2214 — Data Structures; ITCS 3211 — Intro to Algorithms | Java tutorials, Java API docs, practice exercises |
| `api-development` | ITIS 4166 — Network-Based Apps; ITIS 4100 — Applied Systems Integration | Spring Guides, REST API tutorials, design exercises |
| `database-design` | ITIS 3300 — Database Management; ITIS 4166 — Network-Based Apps | SQL practice, schema design exercises, DB modeling tutorials |
| `web-development` | ITIS 3130 — Web Development; ITIS 4166 — Network-Based Apps | MDN web docs, frontend practice labs, accessibility checklists |
| `agile` | ITCS 3155 — Software Engineering; ITCS 4181 — Software Engineering Studio | Agile planning templates, sprint exercise guides, team retrospective examples |

Each skill recommendation is mapped to curated local demo data so the interface can show relevant options without relying on real student data or university records. Resource links should be usable and clearly labeled as illustrative practice aids rather than official academic endorsements.

## Milestones

1. **Planned — Recommendation data model and demo seed content** — define the recommendation structure, seed curated skill-to-course/resource mappings, and connect them to the existing shared skill IDs.
2. **Planned — Missing-skill selection and empty states** — add a missing-skill selector or targeted view that shows relevant courses/resources for the selected skill, and explain when no recommendations are available.
3. **Planned — Actionable UI and verification** — implement usable resource links, recommended course cards, accessible empty/error states, and validation for acceptance criteria; record actual outcomes in `docs/issue-4-test-results.md`.

## Acceptance criteria for the complete feature

- The student can select a missing skill to see its learning options.
- Available options identify relevant UNC Charlotte electives and practice resources for that skill.
- Each online resource provides a usable link.
- The interface indicates when no course or resource is available for a selected skill.
