import { courses, skills, skillsById } from "./catalog";
import { courseCatalogUrl, learningOptionsBySkillId } from "./learningOptions";

export type ItineraryActivityType = "Course" | "Project" | "Practice resource";

export interface ItineraryActivity {
  id: string;
  name: string;
  type: ItineraryActivityType;
  skillIds: string[];
  resourceUrl: string | null;
  courseId?: string;
}

const projectIdeasBySkillId: Record<string, string> = {
  java: "Build a command-line study planner in Java",
  "object-oriented-programming": "Model a campus event system with object-oriented classes",
  "information-security": "Review a sample web app with the OWASP Top 10",
  networking: "Plan a small campus network and document its subnets",
  agile: "Plan and review a one-week sprint for a sample campus app",
  "api-development": "Build a REST API for a course planner",
  "database-design": "Design a relational database for campus events",
  "web-development": "Create an accessible student portfolio page",
};

const courseActivities: ItineraryActivity[] = courses.map((course) => ({
  id: `course:${course.id}`,
  name: `${course.code} — ${course.title}`,
  type: "Course" as const,
  skillIds: [...course.skillIds],
  resourceUrl: courseCatalogUrl,
  courseId: course.id,
}));

const projectActivities: ItineraryActivity[] = skills.flatMap((skill) => {
  const name = projectIdeasBySkillId[skill.id];
  return name
    ? [{
        id: `project:${skill.id}`,
        name,
        type: "Project" as const,
        skillIds: [skill.id],
        resourceUrl: null,
      }]
    : [];
});

const resourceActivities: ItineraryActivity[] = Object.entries(learningOptionsBySkillId)
  .flatMap(([skillId, options]) =>
    options.resources.map((resource, index) => ({
      id: `resource:${skillId}:${index}`,
      name: resource.title,
      type: "Practice resource" as const,
      skillIds: [skillId],
      resourceUrl: resource.url,
    })),
  );

export const itineraryActivityCatalog: ItineraryActivity[] = [
  ...courseActivities,
  ...projectActivities,
  ...resourceActivities,
];

export function getItineraryRecommendations(
  skillId: string,
  completedCourseIds: readonly string[],
): ItineraryActivity[] {
  const completedIds = new Set(completedCourseIds);
  return itineraryActivityCatalog
    .filter(
      (activity) =>
        activity.skillIds.includes(skillId) &&
        (!activity.courseId || !completedIds.has(activity.courseId)),
    )
    .map((activity) => ({ ...activity, skillIds: [...activity.skillIds] }));
}

export function getItinerarySkillNames(skillIds: readonly string[]): string {
  return skillIds.map((skillId) => skillsById.get(skillId)?.name ?? skillId).join(", ");
}
