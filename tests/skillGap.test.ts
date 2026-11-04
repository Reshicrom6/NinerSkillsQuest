import { describe, expect, it } from "vitest";
import { compareTargetSkills } from "../src/data/skillGap";

describe("target skill comparison", () => {
  it("separates recorded matches from target skills not recorded", () => {
    expect(compareTargetSkills(["java", "agile"], ["java", "api", "agile"])).toEqual({
      status: "ready",
      matchedSkillIds: ["java", "agile"],
      unmatchedTargetSkillIds: ["api"],
    });
  });

  it("deduplicates evidence and target skill IDs", () => {
    expect(compareTargetSkills(["java", "java"], ["java", "java", "api"])).toEqual({
      status: "ready",
      matchedSkillIds: ["java"],
      unmatchedTargetSkillIds: ["api"],
    });
  });

  it("updates the result when either inventory or target skills change", () => {
    const first = compareTargetSkills(["java"], ["java", "api"]);
    const afterInventoryChange = compareTargetSkills(["java", "api"], ["java", "api"]);
    const afterGoalChange = compareTargetSkills(["java", "api"], ["java", "database"]);

    expect(first.unmatchedTargetSkillIds).toEqual(["api"]);
    expect(afterInventoryChange.unmatchedTargetSkillIds).toEqual([]);
    expect(afterGoalChange.unmatchedTargetSkillIds).toEqual(["database"]);
  });

  it("explains missing goals and empty target sets as unavailable comparisons", () => {
    expect(compareTargetSkills([], null)).toEqual({
      status: "missing-goal",
      matchedSkillIds: [],
      unmatchedTargetSkillIds: [],
    });
    expect(compareTargetSkills(["java"], [])).toEqual({
      status: "empty-target",
      matchedSkillIds: [],
      unmatchedTargetSkillIds: [],
    });
  });
});
