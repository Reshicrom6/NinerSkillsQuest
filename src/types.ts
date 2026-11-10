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
