import { careerRoadmaps, employerProfiles } from "../data/careerGoals";
import type {
  CareerRoadmap,
  EmployerProfile,
  TargetProfile,
} from "../types";

const STORAGE_KEY = "niner-skills-quest.career-goal";

type StoragePort = Pick<Storage, "getItem" | "setItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export interface CareerGoalState {
  selectedRoadmapId: string | null;
  selectedEmployerId: string | null;
  selectedRoadmap: CareerRoadmap | null;
  selectedEmployer: EmployerProfile | null;
  targetProfile: TargetProfile | null;
  persistenceMessage: string | null;
}

type Listener = (state: CareerGoalState) => void;

export class CareerGoalStore {
  private readonly listeners = new Set<Listener>();
  private readonly roadmapById: Map<string, CareerRoadmap>;
  private readonly employerById: Map<string, EmployerProfile>;
  private readonly storage: StoragePort | null;
  private selectedRoadmapId: string | null = null;
  private selectedEmployerId: string | null = null;
  private persistenceMessage: string | null = null;

  constructor(
    storage?: StoragePort,
    roadmaps: CareerRoadmap[] = careerRoadmaps,
    employers: EmployerProfile[] = employerProfiles,
  ) {
    this.roadmapById = new Map(roadmaps.map((roadmap) => [roadmap.id, roadmap]));
    this.employerById = new Map(employers.map((employer) => [employer.id, employer]));
    this.storage = storage === undefined ? this.getBrowserStorage() : storage;
    this.loadSelections();
  }

  getState(): CareerGoalState {
    const selectedRoadmap = this.selectedRoadmapId
      ? this.roadmapById.get(this.selectedRoadmapId) ?? null
      : null;
    const selectedEmployer = this.selectedEmployerId
      ? this.employerById.get(this.selectedEmployerId) ?? null
      : null;

    return {
      selectedRoadmapId: this.selectedRoadmapId,
      selectedEmployerId: this.selectedEmployerId,
      selectedRoadmap,
      selectedEmployer,
      targetProfile:
        selectedRoadmap && selectedEmployer
          ? {
              roadmapId: selectedRoadmap.id,
              employerId: selectedEmployer.id,
              skillIds: [...selectedRoadmap.skillIds],
            }
          : null,
      persistenceMessage: this.persistenceMessage,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  selectRoadmap(roadmapId: string | null): void {
    if (roadmapId !== null && !this.roadmapById.has(roadmapId)) {
      return;
    }
    if (roadmapId === this.selectedRoadmapId) {
      return;
    }

    this.selectedRoadmapId = roadmapId;
    this.saveSelections();
    this.notify();
  }

  selectEmployer(employerId: string | null): void {
    if (employerId !== null && !this.employerById.has(employerId)) {
      return;
    }
    if (employerId === this.selectedEmployerId) {
      return;
    }

    this.selectedEmployerId = employerId;
    this.saveSelections();
    this.notify();
  }

  private getBrowserStorage(): StoragePort | null {
    try {
      return window.localStorage;
    } catch {
      this.persistenceMessage =
        "Your career goal will work for this session, but browser storage is unavailable.";
      return null;
    }
  }

  private loadSelections(): void {
    if (!this.storage) {
      return;
    }

    let savedValue: string | null;
    try {
      savedValue = this.storage.getItem(STORAGE_KEY);
    } catch {
      this.persistenceMessage =
        "Your career goal will work for this session, but saved goal selections could not be loaded.";
      return;
    }

    if (savedValue === null) {
      return;
    }

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(savedValue);
    } catch {
      this.setInvalidSavedDataMessage();
      return;
    }

    if (!isRecord(parsedValue)) {
      this.setInvalidSavedDataMessage();
      return;
    }

    const roadmapId = parsedValue.selectedRoadmapId;
    const employerId = parsedValue.selectedEmployerId;
    const validRoadmapId =
      roadmapId === null ||
      (typeof roadmapId === "string" && this.roadmapById.has(roadmapId));
    const validEmployerId =
      employerId === null ||
      (typeof employerId === "string" && this.employerById.has(employerId));

    if (!validRoadmapId || !validEmployerId) {
      this.setInvalidSavedDataMessage();
    }
    this.selectedRoadmapId =
      typeof roadmapId === "string" && this.roadmapById.has(roadmapId)
        ? roadmapId
        : null;
    this.selectedEmployerId =
      typeof employerId === "string" && this.employerById.has(employerId)
        ? employerId
        : null;
  }

  private setInvalidSavedDataMessage(): void {
    this.persistenceMessage =
      "Some saved career-goal data was invalid and has been ignored. Choose your goal again to save valid selections.";
  }

  private saveSelections(): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedRoadmapId: this.selectedRoadmapId,
          selectedEmployerId: this.selectedEmployerId,
        }),
      );
      this.persistenceMessage = null;
    } catch {
      this.persistenceMessage =
        "Your career goal is updated for this session, but could not be saved in this browser.";
    }
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const careerGoalStore = new CareerGoalStore();
