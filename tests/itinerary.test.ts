import { describe, expect, it } from "vitest";
import {
  getItineraryRecommendations,
  itineraryActivityCatalog,
} from "../src/data/itinerary";
import {
  ItineraryStore,
  type ItineraryState,
} from "../src/state/itineraryStore";

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

describe("itinerary recommendations", () => {
  it("offers a course, project, and practice resource for a supported skill", () => {
    const recommendations = getItineraryRecommendations("java", []);
    const activityIds = itineraryActivityCatalog.map((activity) => activity.id);

    expect(recommendations.map((activity) => activity.type)).toEqual([
      "Course",
      "Project",
      "Practice resource",
    ]);
    expect(recommendations.every((activity) => activity.skillIds.includes("java"))).toBe(true);
    expect(new Set(activityIds).size).toBe(activityIds.length);
    expect(
      itineraryActivityCatalog
        .filter((activity) => activity.resourceUrl)
        .every((activity) => activity.resourceUrl?.startsWith("https://")),
    ).toBe(true);
    expect(recommendations.find((activity) => activity.type === "Course")?.resourceUrl)
      .toMatch(/^https:\/\//);
    expect(recommendations.find((activity) => activity.type === "Practice resource")?.resourceUrl)
      .toMatch(/^https:\/\//);
    expect(recommendations.find((activity) => activity.type === "Project")?.resourceUrl).toBeNull();
  });

  it("omits a completed course and returns no activities for an unsupported skill", () => {
    expect(
      getItineraryRecommendations("java", ["itcs-2214"]).map((activity) => activity.type),
    ).toEqual(["Project", "Practice resource"]);
    expect(getItineraryRecommendations("unsupported", [])).toEqual([]);
  });
});

describe("itinerary store", () => {
  it("adds each activity type, rejects duplicates, removes items, and restores after reload", () => {
    const storage = createStorage();
    const store = new ItineraryStore(storage);
    const recommendations = getItineraryRecommendations("java", []);

    for (const activity of recommendations) {
      expect(store.addActivity(activity.id)).toMatchObject({ ok: true, persisted: true });
    }
    expect(store.getState().activities).toHaveLength(3);
    expect(store.addActivity(recommendations[0].id)).toEqual({
      ok: false,
      reason: "duplicate",
    });
    expect(store.addActivity("unknown")).toEqual({
      ok: false,
      reason: "unsupported",
    });

    expect(store.removeActivity(recommendations[1].id)).toBe(true);
    const restored = new ItineraryStore(storage);
    expect(restored.getState().activities.map((activity) => activity.type)).toEqual([
      "Course",
      "Practice resource",
    ]);
    expect(restored.removeActivity("unknown")).toBe(false);
  });

  it("does not duplicate one course recommended for two associated skills", () => {
    const store = new ItineraryStore(createStorage());
    const javaCourse = getItineraryRecommendations("java", []).find(
      (activity) => activity.type === "Course",
    );
    const objectOrientedCourse = getItineraryRecommendations(
      "object-oriented-programming",
      [],
    ).find((activity) => activity.type === "Course");

    if (!javaCourse || !objectOrientedCourse) {
      throw new Error("Expected both skills to recommend ITCS 2214.");
    }

    expect(javaCourse.id).toBe(objectOrientedCourse.id);
    expect(store.addActivity(javaCourse.id).ok).toBe(true);
    expect(store.addActivity(objectOrientedCourse.id)).toEqual({
      ok: false,
      reason: "duplicate",
    });
  });

  it("skips invalid or duplicate stored IDs and reports malformed storage", () => {
    const validId = itineraryActivityCatalog[0].id;
    const invalidIds = new ItineraryStore(createStorage(JSON.stringify([
      validId,
      validId,
      "unknown",
      null,
    ])));
    expect(invalidIds.getState().activities.map((activity) => activity.id)).toEqual([validId]);
    expect(invalidIds.getState().persistenceMessage).toMatch(/invalid and have been skipped/i);

    const malformed = new ItineraryStore(createStorage("{bad"));
    expect(malformed.getState().persistenceMessage).toMatch(/invalid and has been ignored/i);
  });

  it("reports load and save failures while keeping current-session updates usable", () => {
    const loadFailure = new ItineraryStore({
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {},
    });
    expect(loadFailure.getState().persistenceMessage).toMatch(/could not be loaded/i);

    const saveFailure = new ItineraryStore({
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    });
    const activity = getItineraryRecommendations("java", [])[0];
    expect(saveFailure.addActivity(activity.id)).toMatchObject({
      ok: true,
      persisted: false,
    });
    const state: ItineraryState = saveFailure.getState();
    expect(state.activities).toHaveLength(1);
    expect(state.persistenceMessage).toMatch(/could not be saved/i);
  });
});
