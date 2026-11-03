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
