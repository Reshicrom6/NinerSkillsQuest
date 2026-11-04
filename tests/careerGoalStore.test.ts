import { describe, expect, it } from "vitest";
import { careerRoadmaps, employerProfiles } from "../src/data/careerGoals";
import { CareerGoalStore } from "../src/state/careerGoalStore";

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

describe("career goal state", () => {
  it("starts without a target profile and prompts for both required selections", () => {
    const store = new CareerGoalStore(createStorage());

    expect(store.getState().selectedRoadmap).toBeNull();
    expect(store.getState().selectedEmployer).toBeNull();
    expect(store.getState().targetProfile).toBeNull();
  });

  it("creates and persists a target profile from supported selections", () => {
    const storage = createStorage();
    const store = new CareerGoalStore(storage);

    store.selectRoadmap(careerRoadmaps[0].id);
    expect(store.getState().targetProfile).toBeNull();
    store.selectEmployer(employerProfiles[0].id);

    expect(store.getState().targetProfile).toEqual({
      roadmapId: careerRoadmaps[0].id,
      employerId: employerProfiles[0].id,
      skillIds: careerRoadmaps[0].skillIds,
    });

    const restoredStore = new CareerGoalStore(storage);
    expect(restoredStore.getState().targetProfile).toEqual(store.getState().targetProfile);
  });

  it("updates either selection and clears the target profile when a required selection is removed", () => {
    const store = new CareerGoalStore(createStorage());
    store.selectRoadmap(careerRoadmaps[0].id);
    store.selectEmployer(employerProfiles[0].id);

    store.selectRoadmap(careerRoadmaps[1].id);
    expect(store.getState().targetProfile?.roadmapId).toBe(careerRoadmaps[1].id);
    expect(store.getState().targetProfile?.skillIds).toEqual(careerRoadmaps[1].skillIds);

    store.selectEmployer(employerProfiles[1].id);
    expect(store.getState().targetProfile?.employerId).toBe(employerProfiles[1].id);

    store.selectRoadmap(null);
    expect(store.getState().selectedEmployerId).toBe(employerProfiles[1].id);
    expect(store.getState().targetProfile).toBeNull();
  });

  it("ignores unsupported choices", () => {
    const store = new CareerGoalStore(createStorage());

    store.selectRoadmap("unsupported-roadmap");
    store.selectEmployer("unsupported-employer");

    expect(store.getState().selectedRoadmapId).toBeNull();
    expect(store.getState().selectedEmployerId).toBeNull();
  });

  it("recovers valid saved selections and reports invalid values", () => {
    const storage = createStorage(
      JSON.stringify({
        selectedRoadmapId: "unknown-roadmap",
        selectedEmployerId: employerProfiles[0].id,
      }),
    );
    const store = new CareerGoalStore(storage);

    expect(store.getState().selectedRoadmapId).toBeNull();
    expect(store.getState().selectedEmployerId).toBe(employerProfiles[0].id);
    expect(store.getState().targetProfile).toBeNull();
    expect(store.getState().persistenceMessage).toMatch(/invalid and has been ignored/i);

    store.selectRoadmap(careerRoadmaps[0].id);
    expect(store.getState().persistenceMessage).toBeNull();
    expect(JSON.parse(storage.value ?? "null")).toEqual({
      selectedRoadmapId: careerRoadmaps[0].id,
      selectedEmployerId: employerProfiles[0].id,
    });
  });

  it("reports malformed saved data without blocking new selections", () => {
    const store = new CareerGoalStore(createStorage("{not json"));

    expect(store.getState().persistenceMessage).toMatch(/invalid and has been ignored/i);
    store.selectRoadmap(careerRoadmaps[0].id);
    expect(store.getState().selectedRoadmapId).toBe(careerRoadmaps[0].id);
    expect(store.getState().persistenceMessage).toBeNull();
  });

  it("reports storage read and write failures while keeping session state usable", () => {
    const readFailureStore = new CareerGoalStore({
      getItem: (_key: string) => {
        throw new Error("storage is blocked");
      },
      setItem: (_key: string, _value: string) => undefined,
    });
    expect(readFailureStore.getState().persistenceMessage).toMatch(/could not be loaded/i);

    const writeFailureStore = new CareerGoalStore({
      getItem: (_key: string) => null,
      setItem: (_key: string, _value: string) => {
        throw new Error("storage is full");
      },
    });
    writeFailureStore.selectRoadmap(careerRoadmaps[0].id);

    expect(writeFailureStore.getState().selectedRoadmapId).toBe(careerRoadmaps[0].id);
    expect(writeFailureStore.getState().persistenceMessage).toMatch(/could not be saved/i);
  });
});
