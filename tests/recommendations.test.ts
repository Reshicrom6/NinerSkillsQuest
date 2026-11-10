import { describe, expect, it } from "vitest";
import {
  getRecommendationsForSkill,
  recommendationsBySkillId,
} from "../src/data/recommendations";

describe("missing-skill recommendations", () => {
  it("includes seeded recommendations for a missing skill", () => {
    const javaRecommendations = getRecommendationsForSkill("java");

    expect(javaRecommendations).not.toBeNull();
    expect(javaRecommendations?.skillName).toBe("Java");
    expect(javaRecommendations?.electives.length).toBeGreaterThan(0);
    expect(javaRecommendations?.resources.length).toBeGreaterThan(0);
    expect(javaRecommendations?.resources.every((resource) => resource.url.length > 0)).toBe(true);
  });

  it("stores recommendations by skill id for lookup", () => {
    expect(recommendationsBySkillId.has("api-development")).toBe(true);
    expect(recommendationsBySkillId.get("api-development")?.electives[0]?.title).toContain("Network");
  });
});
