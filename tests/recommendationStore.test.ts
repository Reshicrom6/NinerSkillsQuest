import { describe, expect, it } from "vitest";
import { RecommendationStore } from "../src/state/recommendationStore";

describe("recommendation store", () => {
  it("selects the first available missing skill when initialized", () => {
    const store = new RecommendationStore(["java", "api-development"]);

    expect(store.getState().availableSkillIds).toEqual(["java", "api-development"]);
    expect(store.getState().selectedSkillId).toBe("java");
  });

  it("ignores unsupported skill selections", () => {
    const store = new RecommendationStore(["java"]);

    store.setSelectedSkillId("web-development");
    expect(store.getState().selectedSkillId).toBe("java");
  });

  it("clears the current selection when no missing skill remains", () => {
    const store = new RecommendationStore(["java"]);

    store.setMissingSkillIds([]);
    expect(store.getState().availableSkillIds).toEqual([]);
    expect(store.getState().selectedSkillId).toBeNull();
  });
});
