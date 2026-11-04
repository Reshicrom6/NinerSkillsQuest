import { skills } from "../data/catalog";
import type { Skill } from "../types";

const STORAGE_KEY = "niner-skills-quest.custom-experiences";

export const experienceTypes = ["Project", "Employment", "Volunteer", "Other"] as const;
export type ExperienceType = (typeof experienceTypes)[number];

export interface ExperienceDraft {
  title: string;
  type: string;
  skillIds: string[];
}

export interface ExperienceRecord {
  id: string;
  title: string;
  type: ExperienceType;
  skillIds: string[];
}

export type ExperienceValidationErrors = Partial<
  Record<"title" | "type" | "skillIds", string>
>;

export type ExperienceMutationResult =
  | { ok: true; record: ExperienceRecord }
  | { ok: false; errors: ExperienceValidationErrors };

export interface ExperienceState {
  experiences: ExperienceRecord[];
  skills: Skill[];
  persistenceMessage: string | null;
}

type StoragePort = Pick<Storage, "getItem" | "setItem">;
type Listener = (state: ExperienceState) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExperienceType(type: string): type is ExperienceType {
  return experienceTypes.some((supportedType) => supportedType === type);
}

export function validateExperienceDraft(
  draft: ExperienceDraft,
  skillCatalog: readonly Skill[] = skills,
): ExperienceValidationErrors {
  const errors: ExperienceValidationErrors = {};
  const title = draft.title.trim();
  const supportedSkillIds = new Set(skillCatalog.map((skill) => skill.id));

  if (!title) {
    errors.title = "Enter an experience title.";
  } else if (title.length > 100) {
    errors.title = "Use a title of 100 characters or fewer.";
  }
  if (!isExperienceType(draft.type)) {
    errors.type = "Choose a supported experience type.";
  }
  if (draft.skillIds.length === 0) {
    errors.skillIds = "Select at least one supported skill.";
  } else if (
    draft.skillIds.some((skillId) => !supportedSkillIds.has(skillId)) ||
    new Set(draft.skillIds).size !== draft.skillIds.length
  ) {
    errors.skillIds = "Choose each supported skill only once.";
  }

  return errors;
}

export class ExperienceStore {
  private readonly listeners = new Set<Listener>();
  private readonly skillById: Map<string, Skill>;
  private readonly storage: StoragePort | null;
  private readonly createId: () => string;
  private experiences: ExperienceRecord[] = [];
  private persistenceMessage: string | null = null;

  constructor(
    storage?: StoragePort,
    skillCatalog: Skill[] = skills,
    createId: () => string = () => globalThis.crypto.randomUUID(),
  ) {
    this.skillById = new Map(skillCatalog.map((skill) => [skill.id, skill]));
    this.storage = storage === undefined ? this.getBrowserStorage() : storage;
    this.createId = createId;
    this.loadExperiences();
  }

  getState(): ExperienceState {
    const seenSkillIds = new Set<string>();
    const recordedSkills: Skill[] = [];
    for (const experience of this.experiences) {
      for (const skillId of experience.skillIds) {
        const skill = this.skillById.get(skillId);
        if (skill && !seenSkillIds.has(skillId)) {
          seenSkillIds.add(skillId);
          recordedSkills.push(skill);
        }
      }
    }

    return {
      experiences: this.experiences.map((experience) => ({
        ...experience,
        skillIds: [...experience.skillIds],
      })),
      skills: recordedSkills,
      persistenceMessage: this.persistenceMessage,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  addExperience(draft: ExperienceDraft): ExperienceMutationResult {
    const errors = validateExperienceDraft(draft, [...this.skillById.values()]);
    if (Object.keys(errors).length > 0) {
      return { ok: false, errors };
    }
    if (!isExperienceType(draft.type)) {
      return { ok: false, errors: { type: "Choose a supported experience type." } };
    }

    const record: ExperienceRecord = {
      id: this.createId(),
      title: draft.title.trim(),
      type: draft.type,
      skillIds: [...draft.skillIds],
    };
    this.experiences = [...this.experiences, record];
    this.saveExperiences();
    this.notify();
    return { ok: true, record: { ...record, skillIds: [...record.skillIds] } };
  }

  updateExperience(id: string, draft: ExperienceDraft): ExperienceMutationResult {
    const existing = this.experiences.find((experience) => experience.id === id);
    if (!existing) {
      return { ok: false, errors: { title: "This experience is no longer available. Refresh and try again." } };
    }

    const errors = validateExperienceDraft(draft, [...this.skillById.values()]);
    if (Object.keys(errors).length > 0) {
      return { ok: false, errors };
    }
    if (!isExperienceType(draft.type)) {
      return { ok: false, errors: { type: "Choose a supported experience type." } };
    }

    const updated: ExperienceRecord = {
      id,
      title: draft.title.trim(),
      type: draft.type,
      skillIds: [...draft.skillIds],
    };
    this.experiences = this.experiences.map((experience) =>
      experience.id === id ? updated : experience,
    );
    this.saveExperiences();
    this.notify();
    return { ok: true, record: { ...updated, skillIds: [...updated.skillIds] } };
  }

  removeExperience(id: string): boolean {
    if (!this.experiences.some((experience) => experience.id === id)) {
      return false;
    }
    this.experiences = this.experiences.filter((experience) => experience.id !== id);
    this.saveExperiences();
    this.notify();
    return true;
  }

  private getBrowserStorage(): StoragePort | null {
    try {
      return window.localStorage;
    } catch {
      this.persistenceMessage =
        "Custom experiences work for this session, but browser storage is unavailable.";
      return null;
    }
  }

  private loadExperiences(): void {
    if (!this.storage) {
      return;
    }

    let savedValue: string | null;
    try {
      savedValue = this.storage.getItem(STORAGE_KEY);
    } catch {
      this.persistenceMessage =
        "Saved custom experiences could not be loaded. You can still add experiences this session.";
      return;
    }
    if (savedValue === null) {
      return;
    }

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(savedValue);
    } catch {
      this.persistenceMessage =
        "Saved custom experience data was invalid and has been ignored.";
      return;
    }
    if (!Array.isArray(parsedValue)) {
      this.persistenceMessage =
        "Saved custom experience data was invalid and has been ignored.";
      return;
    }

    const seenIds = new Set<string>();
    let skippedInvalidRecords = false;
    this.experiences = parsedValue.flatMap((value): ExperienceRecord[] => {
      if (!isRecord(value) || typeof value.id !== "string" || !value.id || seenIds.has(value.id)) {
        skippedInvalidRecords = true;
        return [];
      }
      if (
        typeof value.title !== "string" ||
        typeof value.type !== "string" ||
        !Array.isArray(value.skillIds) ||
        !value.skillIds.every((skillId): skillId is string => typeof skillId === "string")
      ) {
        skippedInvalidRecords = true;
        return [];
      }

      const draft = { title: value.title, type: value.type, skillIds: value.skillIds };
      if (
        !isExperienceType(value.type) ||
        Object.keys(validateExperienceDraft(draft, [...this.skillById.values()])).length > 0
      ) {
        skippedInvalidRecords = true;
        return [];
      }

      seenIds.add(value.id);
      return [{
        id: value.id,
        title: value.title.trim(),
        type: value.type,
        skillIds: [...value.skillIds],
      }];
    });

    if (skippedInvalidRecords) {
      this.persistenceMessage =
        "Some invalid saved experiences were ignored. Save a valid experience to refresh the list.";
    }
  }

  private saveExperiences(): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.experiences));
      this.persistenceMessage = null;
    } catch {
      this.persistenceMessage =
        "Custom experiences are updated for this session, but could not be saved in this browser.";
    }
  }

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const experienceStore = new ExperienceStore();
