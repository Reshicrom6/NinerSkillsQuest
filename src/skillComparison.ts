import type { Skill } from "./types";

export interface SkillComparison {
  matchedSkills: Skill[];
  missingSkills: Skill[];
}

export function compareSkills(
  recordedSkills: Skill[],
  targetSkills: Skill[],
): SkillComparison {
  const recordedIds = new Set(recordedSkills.map((skill) => skill.id));
  const matchedIds = new Set<string>();

  const matchedSkills = targetSkills.filter((skill) => {
    if (!recordedIds.has(skill.id) || matchedIds.has(skill.id)) {
      return false;
    }
    matchedIds.add(skill.id);
    return true;
  });

  const missingSkills = targetSkills.filter(
    (skill) => !recordedIds.has(skill.id) && !matchedIds.has(skill.id),
  );

  return { matchedSkills, missingSkills };
}
