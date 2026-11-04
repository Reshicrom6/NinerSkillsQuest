import { describe, expect, it } from "vitest";
import { skills } from "../src/data/catalog";
import { courseCatalogUrl, getLearningOptions } from "../src/data/learningOptions";

describe("curated learning options", () => {
  it("provides an official catalog topic and usable HTTPS resources for every supported skill", () => {
    expect(courseCatalogUrl).toMatch(/^https:\/\//);

    for (const skill of skills) {
      const options = getLearningOptions(skill.id);
      expect(options, `${skill.id} has curated options`).not.toBeNull();
      expect(options?.catalogSearchTerm).toBeTruthy();
      expect(options?.resources.length).toBeGreaterThan(0);
      for (const resource of options?.resources ?? []) {
        expect(resource.url).toMatch(/^https:\/\//);
      }
    }
  });

  it("returns no options for an unsupported skill so the interface can show an empty state", () => {
    expect(getLearningOptions("unmapped-skill")).toBeNull();
  });
});
