import { describe, expect, it } from "vitest";
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
});
