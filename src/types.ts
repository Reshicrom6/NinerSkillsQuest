export interface Skill {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  skillIds: string[];
}

export const experienceTypes = [
  "Project",
  "Internship",
  "Work Experience",
  "Research",
  "Volunteer",
  "Other",
] as const;

export type ExperienceType = (typeof experienceTypes)[number];

export interface Experience {
  id: string;
  title: string;
  type: ExperienceType;
  description: string;
  portfolioUrl: string | null;
  skillIds: string[];
}

export interface ExperienceInput {
  title: string;
  type: string;
  description: string;
  portfolioUrl: string;
  skillIds: string[];
}

export interface ExperienceValidationErrors {
  title?: string;
  type?: string;
  skillIds?: string;
  portfolioUrl?: string;
}

export interface StudentSelections {
  completedCourseIds: string[];
}

export interface CareerRoadmap {
  id: string;
  name: string;
  description: string;
  skillIds: string[];
}

export interface EmployerProfile {
  id: string;
  name: string;
  location: string;
  industry: string;
}

export interface TargetProfile {
  roadmapId: string;
  employerId: string;
  skillIds: string[];
}

export interface CourseRecommendation {
  code: string;
  title: string;
  url: string;
}

export interface PracticeResource {
  title: string;
  url: string;
}

export interface SkillRecommendation {
  skillId: string;
  skillName: string;
  electives: CourseRecommendation[];
  resources: PracticeResource[];
}
