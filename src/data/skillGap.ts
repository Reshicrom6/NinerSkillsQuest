export type SkillGapStatus = "missing-goal" | "empty-target" | "ready";

export interface SkillGapComparison {
  status: SkillGapStatus;
  matchedSkillIds: string[];
  unmatchedTargetSkillIds: string[];
}

export function compareTargetSkills(
  recordedSkillIds: readonly string[],
  targetSkillIds: readonly string[] | null,
): SkillGapComparison {
  if (targetSkillIds === null) {
    return {
      status: "missing-goal",
      matchedSkillIds: [],
      unmatchedTargetSkillIds: [],
    };
  }

  const uniqueTargetSkillIds = [...new Set(targetSkillIds)];
  if (uniqueTargetSkillIds.length === 0) {
    return {
      status: "empty-target",
      matchedSkillIds: [],
      unmatchedTargetSkillIds: [],
    };
  }

  const recordedIds = new Set(recordedSkillIds);
  const matchedSkillIds = uniqueTargetSkillIds.filter((skillId) => recordedIds.has(skillId));
  const unmatchedTargetSkillIds = uniqueTargetSkillIds.filter((skillId) => !recordedIds.has(skillId));

  return {
    status: "ready",
    matchedSkillIds,
    unmatchedTargetSkillIds,
  };
}
