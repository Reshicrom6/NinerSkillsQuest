import { recommendationsBySkillId } from "../data/recommendations";

export interface RecommendationState {
  availableSkillIds: string[];
  selectedSkillId: string | null;
}

export class RecommendationStore {
  private availableSkillIds: string[] = [];
  private selectedSkillId: string | null = null;

  constructor(skillIds: readonly string[] = []) {
    this.setMissingSkillIds(skillIds);
  }

  setMissingSkillIds(skillIds: readonly string[]): void {
    const uniqueSkillIds = [...new Set(skillIds.filter((skillId) => recommendationsBySkillId.has(skillId)))];
    this.availableSkillIds = uniqueSkillIds;

    if (!this.availableSkillIds.includes(this.selectedSkillId ?? "")) {
      this.selectedSkillId = this.availableSkillIds[0] ?? null;
    }
  }

  setSelectedSkillId(skillId: string | null): void {
    if (skillId === null) {
      this.selectedSkillId = null;
      return;
    }

    if (!this.availableSkillIds.includes(skillId) || !recommendationsBySkillId.has(skillId)) {
      return;
    }

    this.selectedSkillId = skillId;
  }

  getState(): RecommendationState {
    return {
      availableSkillIds: [...this.availableSkillIds],
      selectedSkillId: this.selectedSkillId,
    };
  }
}

export const recommendationStore = new RecommendationStore();
