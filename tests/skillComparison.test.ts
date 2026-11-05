import { describe, expect, it } from "vitest";
import { compareSkills } from "../src/skillComparison";
import type { Skill } from "../src/types";

const skills: Skill[] = [
  { id: "java", name: "Java" },
  { id: "api-development", name: "API Development" },
  { id: "database-design", name: "Database Design" },
];

describe("compareSkills", () => {
  it("separates matching and missing target skills", () => {
    expect(compareSkills([skills[0]], skills)).toEqual({
      matchedSkills: [skills[0]],
      missingSkills: [skills[1], skills[2]],
    });
  });

  it("returns no gaps when every target skill is recorded", () => {
    expect(compareSkills(skills, [skills[0], skills[2]])).toEqual({
      matchedSkills: [skills[0], skills[2]],
      missingSkills: [],
    });
  });

  it("handles empty recorded or target skills", () => {
    expect(compareSkills([], skills)).toEqual({
      matchedSkills: [],
      missingSkills: skills,
    });
    expect(compareSkills(skills, [])).toEqual({
      matchedSkills: [],
      missingSkills: [],
    });
  });
});
