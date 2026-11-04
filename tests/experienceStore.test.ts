import { describe, expect, it } from "vitest";
import { ExperienceStore, validateExperienceDraft } from "../src/state/experienceStore";

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

describe("custom experience records", () => {
  it("requires a title, supported type, and at least one supported skill", () => {
    expect(validateExperienceDraft({ title: " ", type: "", skillIds: [] })).toEqual({
      title: "Enter an experience title.",
      type: "Choose a supported experience type.",
      skillIds: "Select at least one supported skill.",
    });
    expect(
      validateExperienceDraft({ title: "Project", type: "Project", skillIds: ["unknown"] }),
    ).toEqual({ skillIds: "Choose each supported skill only once." });
  });

  it("adds, edits, persists, and restores self-reported records", () => {
    const storage = createStorage();
    const store = new ExperienceStore(storage, undefined, () => "experience-1");

    const created = store.addExperience({
      title: "Student project",
      type: "Project",
      skillIds: ["java"],
    });
    expect(created.ok).toBe(true);

    const edited = store.updateExperience("experience-1", {
      title: "Updated project",
      type: "Volunteer",
      skillIds: ["java", "agile"],
    });
    expect(edited.ok).toBe(true);

    const restored = new ExperienceStore(storage);
    expect(restored.getState().experiences[0]).toMatchObject({
      id: "experience-1",
      title: "Updated project",
      type: "Volunteer",
      skillIds: ["java", "agile"],
    });
  });

  it("deduplicates skills across experiences and keeps other sources independent", () => {
    let nextId = 0;
    const store = new ExperienceStore(createStorage(), undefined, () => `experience-${++nextId}`);
    store.addExperience({ title: "One", type: "Project", skillIds: ["java"] });
    store.addExperience({ title: "Two", type: "Employment", skillIds: ["java", "agile"] });

    expect(store.getState().skills.map((skill) => skill.id)).toEqual(["java", "agile"]);
    expect(store.removeExperience("experience-1")).toBe(true);
    expect(store.getState().skills.map((skill) => skill.id)).toEqual(["java", "agile"]);
    expect(store.removeExperience("experience-2")).toBe(true);
    expect(store.getState().skills).toEqual([]);
  });

  it("rejects invalid updates without changing the saved record", () => {
    const store = new ExperienceStore(createStorage(), undefined, () => "experience-1");
    store.addExperience({ title: "Valid", type: "Project", skillIds: ["java"] });

    const result = store.updateExperience("experience-1", {
      title: "",
      type: "Project",
      skillIds: ["java"],
    });

    expect(result).toMatchObject({ ok: false, errors: { title: "Enter an experience title." } });
    expect(store.getState().experiences[0].title).toBe("Valid");
  });

  it("reports invalid stored data and storage failures", () => {
    const invalidStore = new ExperienceStore(createStorage("{bad"));
    expect(invalidStore.getState().persistenceMessage).toMatch(/invalid and has been ignored/i);

    const failingStore = new ExperienceStore({
      getItem: () => null,
      setItem: () => {
        throw new Error("storage full");
      },
    }, undefined, () => "experience-1");
    failingStore.addExperience({ title: "Valid", type: "Project", skillIds: ["java"] });
    expect(failingStore.getState().persistenceMessage).toMatch(/could not be saved/i);
  });
});
