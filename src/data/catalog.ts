import type { Course, Skill } from "../types";

export const skills: Skill[] = [
  { id: "java", name: "Java" },
  { id: "object-oriented-programming", name: "OOP" },
  { id: "information-security", name: "InfoSec" },
  { id: "networking", name: "Networking" },
  { id: "agile", name: "Agile" },
  { id: "api-development", name: "API Development" },
  { id: "database-design", name: "Database Design" },
  { id: "web-development", name: "Web Development" },
];

export const courses: Course[] = [
  {
    id: "itcs-2214",
    code: "ITCS 2214",
    title: "Data Structures",
    skillIds: ["java", "object-oriented-programming"],
  },
  {
    id: "itis-3200",
    code: "ITIS 3200",
    title: "Info Security",
    skillIds: ["information-security", "networking"],
  },
  {
    id: "itcs-3155",
    code: "ITCS 3155",
    title: "Software Engineering",
    skillIds: ["agile"],
  },
];

export const skillsById = new Map(skills.map((skill) => [skill.id, skill]));
