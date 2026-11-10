import {
  itineraryActivityCatalog,
  type ItineraryActivity,
} from "../data/itinerary";

const STORAGE_KEY = "niner-skills-quest.itinerary";

type StoragePort = Pick<Storage, "getItem" | "setItem">;
type Listener = (state: ItineraryState) => void;

export interface ItineraryState {
  activities: ItineraryActivity[];
  persistenceMessage: string | null;
}

export type AddItineraryActivityResult =
  | { ok: true; activity: ItineraryActivity; persisted: boolean }
  | { ok: false; reason: "duplicate" | "unsupported" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class ItineraryStore {
  private readonly listeners = new Set<Listener>();
  private readonly activityById: Map<string, ItineraryActivity>;
  private readonly storage: StoragePort | null;
  private activityIds: string[] = [];
  private persistenceMessage: string | null = null;

  constructor(
    storage?: StoragePort,
    activityCatalog: ItineraryActivity[] = itineraryActivityCatalog,
  ) {
    this.activityById = new Map(activityCatalog.map((activity) => [activity.id, activity]));
    this.storage = storage === undefined ? this.getBrowserStorage() : storage;
    this.loadActivities();
  }

  getState(): ItineraryState {
    return {
      activities: this.activityIds
        .map((activityId) => this.activityById.get(activityId))
        .filter((activity): activity is ItineraryActivity => activity !== undefined)
        .map((activity) => ({ ...activity, skillIds: [...activity.skillIds] })),
      persistenceMessage: this.persistenceMessage,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  addActivity(activityId: string): AddItineraryActivityResult {
    const activity = this.activityById.get(activityId);
    if (!activity) {
      return { ok: false, reason: "unsupported" };
    }
    if (this.activityIds.includes(activityId)) {
      return { ok: false, reason: "duplicate" };
    }

    this.activityIds = [...this.activityIds, activityId];
    const persisted = this.saveActivities();
    this.notify();
    return {
      ok: true,
      activity: { ...activity, skillIds: [...activity.skillIds] },
      persisted,
    };
  }

  removeActivity(activityId: string): boolean {
    if (!this.activityIds.includes(activityId)) {
      return false;
    }
    this.activityIds = this.activityIds.filter((savedId) => savedId !== activityId);
    this.saveActivities();
    this.notify();
    return true;
  }

  private getBrowserStorage(): StoragePort | null {
    try {
      return window.localStorage;
    } catch {
      this.persistenceMessage =
        "Your itinerary is available for this session, but browser storage is unavailable.";
      return null;
    }
  }

  private loadActivities(): void {
    if (!this.storage) {
      return;
    }

    let savedValue: string | null;
    try {
      savedValue = this.storage.getItem(STORAGE_KEY);
    } catch {
      this.persistenceMessage =
        "The saved itinerary could not be loaded. You can still add activities for this session.";
      return;
    }
    if (savedValue === null) {
      return;
    }

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(savedValue);
    } catch {
      this.setInvalidDataMessage();
      return;
    }
    if (!Array.isArray(parsedValue)) {
      this.setInvalidDataMessage();
      return;
    }

    const seenIds = new Set<string>();
    let skippedInvalidIds = false;
    for (const value of parsedValue) {
      if (
        typeof value !== "string" ||
        !this.activityById.has(value) ||
        seenIds.has(value)
      ) {
        skippedInvalidIds = true;
        continue;
      }
      seenIds.add(value);
      this.activityIds.push(value);
    }
    if (skippedInvalidIds) {
      this.persistenceMessage =
        "Some saved itinerary activities were invalid and have been skipped. Add or remove an activity to save a clean list.";
    }
  }

  private setInvalidDataMessage(): void {
    this.persistenceMessage =
      "Saved itinerary data was invalid and has been ignored. Add an activity to save a fresh itinerary.";
  }

  private saveActivities(): boolean {
    if (!this.storage) {
      return false;
    }

    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.activityIds));
      this.persistenceMessage = null;
      return true;
    } catch {
      this.persistenceMessage =
        "Your itinerary is updated for this session, but could not be saved in this browser.";
      return false;
    }
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const itineraryStore = new ItineraryStore();
