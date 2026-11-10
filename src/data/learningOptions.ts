export interface LearningResource {
  title: string;
  url: string;
}

export interface LearningOptions {
  catalogSearchTerm: string | null;
  resources: LearningResource[];
}

export const courseCatalogUrl = "https://catalog.charlotte.edu/";

export const learningOptionsBySkillId: Record<string, LearningOptions> = {
  java: {
    catalogSearchTerm: "Java programming",
    resources: [{ title: "Learn Java", url: "https://dev.java/learn/" }],
  },
  "object-oriented-programming": {
    catalogSearchTerm: "Object-oriented programming",
    resources: [
      {
        title: "Object-oriented programming concepts",
        url: "https://docs.oracle.com/javase/tutorial/java/concepts/",
      },
    ],
  },
  "information-security": {
    catalogSearchTerm: "Information security",
    resources: [{ title: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/" }],
  },
  networking: {
    catalogSearchTerm: "Computer networks",
    resources: [{ title: "Cisco Networking Academy", url: "https://www.netacad.com/" }],
  },
  agile: {
    catalogSearchTerm: "Agile software development",
    resources: [{ title: "Agile guides", url: "https://www.atlassian.com/agile" }],
  },
  "api-development": {
    catalogSearchTerm: "Web services and API development",
    resources: [
      {
        title: "Server-side web programming",
        url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side",
      },
    ],
  },
  "database-design": {
    catalogSearchTerm: "Database systems and design",
    resources: [
      {
        title: "PostgreSQL tutorial",
        url: "https://www.postgresql.org/docs/current/tutorial.html",
      },
    ],
  },
  "web-development": {
    catalogSearchTerm: "Web development",
    resources: [{ title: "MDN web development", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development" }],
  },
};

export function getLearningOptions(skillId: string): LearningOptions | null {
  return learningOptionsBySkillId[skillId] ?? null;
}
