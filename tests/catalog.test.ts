import { describe, expect, it } from "vitest";
import { careerRoadmaps } from "../src/data/careerGoals";
import { courses, skills } from "../src/data/catalog";

describe("demo course catalog", () => {
  it("uses unique stable IDs for courses and skills", () => {
    expect(new Set(courses.map((course) => course.id)).size).toBe(courses.length);
    expect(new Set(skills.map((skill) => skill.id)).size).toBe(skills.length);
  });

  it("maps every course skill ID to a shared skill", () => {
    const skillIds = new Set(skills.map((skill) => skill.id));

    for (const course of courses) {
      expect(course.skillIds.length).toBeGreaterThan(0);
      for (const skillId of course.skillIds) {
        expect(skillIds.has(skillId), `${course.code} references ${skillId}`).toBe(true);
      }
    }
  });

  it("uses supported shared skill IDs for the career roadmap", () => {
    const skillIds = new Set(skills.map((skill) => skill.id));

    expect(careerRoadmaps.length).toBeGreaterThan(0);
    expect(new Set(careerRoadmaps.map((roadmap) => roadmap.id)).size).toBe(
      careerRoadmaps.length,
    );
    for (const roadmap of careerRoadmaps) {
      expect(new Set(roadmap.skillIds).size).toBe(roadmap.skillIds.length);
      for (const skillId of roadmap.skillIds) {
        expect(skillIds.has(skillId), `${roadmap.name} references ${skillId}`).toBe(true);
      }
    }
  });
});
