import { skills } from "../data/catalog";
import {
  experienceTypes,
  type Experience,
  type ExperienceInput,
  type ExperienceType,
  type ExperienceValidationErrors,
  type Skill,
} from "../types";

const STORAGE_KEY = "niner-skills-quest.experiences";

type StoragePort = Pick<Storage, "getItem" | "setItem">;

export interface ExperienceState {
  experiences: Experience[];
  skills: Skill[];
  persistenceMessage: string | null;
}

type Listener = (state: ExperienceState) => void;

const validExperienceTypes = new Set<string>(experienceTypes);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExperienceType(value: string): value is ExperienceType {
  return validExperienceTypes.has(value);
}

export function validateExperience(
  input: ExperienceInput,
  supportedSkillIds: ReadonlySet<string> = new Set(skills.map((skill) => skill.id)),
): ExperienceValidationErrors {
  const errors: ExperienceValidationErrors = {};

  if (!input.title.trim()) {
    errors.title = "Enter a project or experience name.";
  }
  if (!validExperienceTypes.has(input.type)) {
    errors.type = "Select a valid experience type.";
  }
  if (
    input.skillIds.length === 0 ||
    input.skillIds.some((skillId) => !supportedSkillIds.has(skillId))
  ) {
    errors.skillIds = "Select at least one supported skill.";
  }
  if (input.portfolioUrl.trim()) {
    try {
      const url = new URL(input.portfolioUrl.trim());
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.portfolioUrl = "Enter a valid http or https link.";
      }
    } catch {
      errors.portfolioUrl = "Enter a valid http or https link.";
    }
  }

  return errors;
}

export class ExperienceStore {
  private readonly listeners = new Set<Listener>();
  private readonly skillById: Map<string, Skill>;
  private readonly storage: StoragePort | null;
  private experiences: Experience[] = [];
  private persistenceMessage: string | null = null;

  constructor(storage?: StoragePort, skillCatalog: Skill[] = skills) {
    this.skillById = new Map(skillCatalog.map((skill) => [skill.id, skill]));
    this.storage = storage === undefined ? this.getBrowserStorage() : storage;
    this.loadExperiences();
  }

  getState(): ExperienceState {
    const seenSkillIds = new Set<string>();
    const derivedSkills: Skill[] = [];

    for (const experience of this.experiences) {
      for (const skillId of experience.skillIds) {
        const skill = this.skillById.get(skillId);
        if (skill && !seenSkillIds.has(skillId)) {
          seenSkillIds.add(skillId);
          derivedSkills.push(skill);
        }
      }
    }

    return {
      experiences: this.experiences.map((experience) => ({
        ...experience,
        skillIds: [...experience.skillIds],
      })),
      skills: derivedSkills,
      persistenceMessage: this.persistenceMessage,
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  addExperience(input: ExperienceInput): void {
    if (Object.keys(validateExperience(input, new Set(this.skillById.keys()))).length > 0) {
      return;
    }

    this.experiences = [...this.experiences, this.createExperience(crypto.randomUUID(), input)];
    this.saveExperiences();
    this.notify();
  }

  updateExperience(id: string, input: ExperienceInput): void {
    if (
      !this.experiences.some((experience) => experience.id === id) ||
      Object.keys(validateExperience(input, new Set(this.skillById.keys()))).length > 0
    ) {
      return;
    }

    this.experiences = this.experiences.map((experience) =>
      experience.id === id ? this.createExperience(id, input) : experience,
    );
    this.saveExperiences();
    this.notify();
  }

  removeExperience(id: string): void {
    if (!this.experiences.some((experience) => experience.id === id)) {
      return;
    }

    this.experiences = this.experiences.filter((experience) => experience.id !== id);
    this.saveExperiences();
    this.notify();
  }

  private createExperience(id: string, input: ExperienceInput): Experience {
    if (!isExperienceType(input.type)) {
      throw new Error("Cannot create an experience with an unsupported type.");
    }

    return {
      id,
      title: input.title.trim(),
      type: input.type,
      description: input.description.trim(),
      portfolioUrl: input.portfolioUrl.trim() || null,
      skillIds: [...new Set(input.skillIds)],
    };
  }

  private getBrowserStorage(): StoragePort | null {
    try {
      return window.localStorage;
    } catch {
      this.persistenceMessage =
        "Your experiences will work for this session, but browser storage is unavailable.";
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
        "Your experiences will work for this session, but saved experiences could not be loaded.";
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
    if (!Array.isArray(parsedValue)) {
      this.setInvalidSavedDataMessage();
      return;
    }

    let skippedInvalidValues = false;
    const recovered: Experience[] = [];
    const seenIds = new Set<string>();
    for (const value of parsedValue) {
      if (!isRecord(value) || typeof value.id !== "string" || !value.id || seenIds.has(value.id)) {
        skippedInvalidValues = true;
        continue;
      }
      if (
        typeof value.title !== "string" ||
        typeof value.type !== "string" ||
        typeof value.description !== "string" ||
        (typeof value.portfolioUrl !== "string" && value.portfolioUrl !== null) ||
        !Array.isArray(value.skillIds) ||
        !value.skillIds.every((skillId) => typeof skillId === "string")
      ) {
        skippedInvalidValues = true;
        continue;
      }

      const supportedSkillIds = [
        ...new Set(value.skillIds.filter((id) => this.skillById.has(id))),
      ];
      if (supportedSkillIds.length !== value.skillIds.length) {
        skippedInvalidValues = true;
      }

      const input: ExperienceInput = {
        title: value.title,
        type: value.type,
        description: value.description,
        portfolioUrl: value.portfolioUrl ?? "",
        skillIds: supportedSkillIds,
      };
      if (Object.keys(validateExperience(input, new Set(this.skillById.keys()))).length > 0) {
        skippedInvalidValues = true;
        continue;
      }

      seenIds.add(value.id);
      recovered.push(this.createExperience(value.id, input));
    }

    this.experiences = recovered;
    if (skippedInvalidValues) {
      this.persistenceMessage =
        "Some saved experience data was invalid and has been skipped. Add, edit, or remove an experience to save a clean list.";
    }
  }

  private setInvalidSavedDataMessage(): void {
    this.persistenceMessage =
      "Saved experience data was invalid and has been ignored. Add an experience to save a fresh list.";
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
        "Your experiences are updated for this session, but could not be saved in this browser.";
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
