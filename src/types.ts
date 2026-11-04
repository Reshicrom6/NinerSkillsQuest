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
