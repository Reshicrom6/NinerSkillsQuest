import { describe, expect, it } from "vitest";
import { skills } from "../src/data/catalog";
import { ExperienceStore, validateExperience } from "../src/state/experienceStore";
import { experienceTypes, type ExperienceInput } from "../src/types";

function createStorage(initialValue: string | null = null) {
  let value = initialValue;
  return {
    getItem: (_key: string) => value,
    setItem: (_key: string, nextValue: string) => {
      value = nextValue;
    },
    get value() {
      return value;
    },
  };
}

const validExperience: ExperienceInput = {
  title: "Campus events tracker",
  type: "Project",
  description: "Built a tool for campus event listings.",
  portfolioUrl: "https://example.com/events",
  skillIds: ["java", "communication"],
};

describe("experience state", () => {
  it("uses the approved experience type options", () => {
    expect(experienceTypes).toEqual([
      "Project",
      "Internship",
      "Work Experience",
      "Research",
      "Volunteer",
      "Other",
    ]);
  });

  it("validates the required title, type, and at least one supported skill", () => {
    expect(
      validateExperience({
        ...validExperience,
        title: " ",
        type: "Course",
        skillIds: [],
      }),
    ).toEqual({
      title: "Enter a project or experience name.",
      type: "Select a valid experience type.",
      skillIds: "Select at least one supported skill.",
    });
  });

  it("accepts supported skills and rejects unsupported portfolio protocols", () => {
    expect(validateExperience(validExperience)).toEqual({});
    expect(
      validateExperience({
        ...validExperience,
        portfolioUrl: "javascript:alert(1)",
      }).portfolioUrl,
    ).toMatch(/http or https/i);
  });

  it("adds, edits, and removes entries and derives their unique skills", () => {
    const store = new ExperienceStore(createStorage());
    store.addExperience(validExperience);
    const added = store.getState();

    expect(added.experiences).toHaveLength(1);
    expect(added.experiences[0]).toMatchObject({
      title: validExperience.title,
      type: "Project",
      portfolioUrl: validExperience.portfolioUrl,
      skillIds: ["java", "communication"],
    });
    expect(added.skills.map((skill) => skill.id)).toEqual(["java", "communication"]);

    const entryId = added.experiences[0].id;
    store.updateExperience(entryId, {
      ...validExperience,
      title: "Updated campus tracker",
      type: "Internship",
      skillIds: ["teamwork"],
    });
    expect(store.getState().experiences[0]).toMatchObject({
      title: "Updated campus tracker",
      type: "Internship",
      skillIds: ["teamwork"],
    });

    store.removeExperience(entryId);
    expect(store.getState().experiences).toEqual([]);
    expect(store.getState().skills).toEqual([]);
    expect(skills.map((skill) => skill.id)).toContain("communication");
  });

  it("keeps a skill represented by another experience after removal", () => {
    const store = new ExperienceStore(createStorage());
    store.addExperience(validExperience);
    store.addExperience({
      ...validExperience,
      title: "Team events",
      skillIds: ["communication"],
    });

    store.removeExperience(store.getState().experiences[0].id);

    expect(store.getState().skills.map((skill) => skill.id)).toEqual(["communication"]);
    expect(store.getState().experiences).toHaveLength(1);
  });

  it("persists and restores entries while reporting invalid stored data", () => {
    const storage = createStorage();
    const store = new ExperienceStore(storage);
    store.addExperience(validExperience);

    const restored = new ExperienceStore(storage);
    expect(restored.getState().experiences).toEqual(store.getState().experiences);

    const invalidStorage = createStorage(
      JSON.stringify([
        { id: "valid", ...validExperience },
        { id: "invalid", ...validExperience, type: "Unknown" },
        { id: "partial-skills", ...validExperience, skillIds: ["java", "unknown-skill"] },
      ]),
    );
    const recovered = new ExperienceStore(invalidStorage);
    expect(recovered.getState().experiences.map((entry) => entry.id)).toEqual([
      "valid",
      "partial-skills",
    ]);
    expect(recovered.getState().experiences[1].skillIds).toEqual(["java"]);
    expect(recovered.getState().persistenceMessage).toMatch(/invalid and has been skipped/i);
  });

  it("reports storage read and write failures while keeping current-session entries usable", () => {
    const readFailureStore = new ExperienceStore({
      getItem: (_key: string) => {
        throw new Error("storage is blocked");
      },
      setItem: (_key: string, _value: string) => undefined,
    });
    expect(readFailureStore.getState().persistenceMessage).toMatch(/could not be loaded/i);

    const writeFailureStore = new ExperienceStore({
      getItem: (_key: string) => null,
      setItem: (_key: string, _value: string) => {
        throw new Error("storage is full");
      },
    });
    writeFailureStore.addExperience(validExperience);
    expect(writeFailureStore.getState().experiences).toHaveLength(1);
    expect(writeFailureStore.getState().persistenceMessage).toMatch(/could not be saved/i);
  });
});
