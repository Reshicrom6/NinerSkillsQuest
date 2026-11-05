import type { SkillRecommendation } from "../types";

export const recommendationCatalog: SkillRecommendation[] = [
  {
    skillId: "java",
    skillName: "Java",
    electives: [
      {
        code: "ITCS 2214",
        title: "Data Structures",
        url: "https://catalog.uncc.edu/courses/itcs/2214",
      },
      {
        code: "ITCS 3211",
        title: "Intro to Algorithms",
        url: "https://catalog.uncc.edu/courses/itcs/3211",
      },
    ],
    resources: [
      {
        title: "Java Tutorials",
        url: "https://docs.oracle.com/javase/tutorial/",
      },
      {
        title: "Java API Documentation",
        url: "https://docs.oracle.com/en/java/javase/",
      },
      {
        title: "Practice exercises",
        url: "https://www.hackerrank.com/domains/java",
      },
    ],
  },
  {
    skillId: "api-development",
    skillName: "API Development",
    electives: [
      {
        code: "ITIS 4166",
        title: "Network-Based Apps",
        url: "https://catalog.uncc.edu/courses/itis/4166",
      },
      {
        code: "ITIS 4100",
        title: "Applied Systems Integration",
        url: "https://catalog.uncc.edu/courses/itis/4100",
      },
    ],
    resources: [
      {
        title: "Spring Guides",
        url: "https://spring.io/guides",
      },
      {
        title: "REST API tutorial",
        url: "https://restfulapi.net/",
      },
      {
        title: "API design exercises",
        url: "https://www.postman.com/",
      },
    ],
  },
  {
    skillId: "database-design",
    skillName: "Database Design",
    electives: [
      {
        code: "ITIS 3300",
        title: "Database Management",
        url: "https://catalog.uncc.edu/courses/itis/3300",
      },
      {
        code: "ITIS 4166",
        title: "Network-Based Apps",
        url: "https://catalog.uncc.edu/courses/itis/4166",
      },
    ],
    resources: [
      {
        title: "SQL practice",
        url: "https://www.sql-practice.com/",
      },
      {
        title: "Schema design exercises",
        url: "https://www.dbdesigner.net/",
      },
      {
        title: "DB modeling tutorial",
        url: "https://www.w3schools.com/sql/",
      },
    ],
  },
  {
    skillId: "web-development",
    skillName: "Web Development",
    electives: [
      {
        code: "ITIS 3130",
        title: "Web Development",
        url: "https://catalog.uncc.edu/courses/itis/3130",
      },
      {
        code: "ITIS 4166",
        title: "Network-Based Apps",
        url: "https://catalog.uncc.edu/courses/itis/4166",
      },
    ],
    resources: [
      {
        title: "MDN Web Docs",
        url: "https://developer.mozilla.org/",
      },
      {
        title: "Frontend practice labs",
        url: "https://www.frontendmentor.io/",
      },
      {
        title: "Accessibility checklist",
        url: "https://webaim.org/standards/508/",
      },
    ],
  },
  {
    skillId: "agile",
    skillName: "Agile",
    electives: [
      {
        code: "ITCS 3155",
        title: "Software Engineering",
        url: "https://catalog.uncc.edu/courses/itcs/3155",
      },
      {
        code: "ITCS 4181",
        title: "Software Engineering Studio",
        url: "https://catalog.uncc.edu/courses/itcs/4181",
      },
    ],
    resources: [
      {
        title: "Agile planning templates",
        url: "https://www.atlassian.com/agile/project-management/kanban-boards",
      },
      {
        title: "Sprint exercise guides",
        url: "https://www.scrum.org/resources/scrum-guide",
      },
      {
        title: "Retrospective examples",
        url: "https://www.agilealliance.org/resources/",
      },
    ],
  },
];

export const recommendationsBySkillId = new Map(
  recommendationCatalog.map((recommendation) => [recommendation.skillId, recommendation]),
);

export function getRecommendationsForSkill(skillId: string): SkillRecommendation | null {
  return recommendationsBySkillId.get(skillId) ?? null;
}
