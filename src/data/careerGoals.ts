import type { CareerRoadmap, EmployerProfile } from "../types";

export const careerRoadmaps: CareerRoadmap[] = [
  {
    id: "backend-developer",
    name: "Backend Developer",
    description: "Build and maintain server-side applications and services.",
    skillIds: [
      "java",
      "object-oriented-programming",
      "api-development",
      "database-design",
      "information-security",
    ],
  },
  {
    id: "full-stack-developer",
    name: "Full-stack Developer",
    description: "Build user-facing web applications and their supporting services.",
    skillIds: [
      "java",
      "object-oriented-programming",
      "api-development",
      "database-design",
      "web-development",
      "agile",
    ],
  },
];

export const employerProfiles: EmployerProfile[] = [
  {
    id: "demo-employer-technology",
    name: "Demo Technology Employer",
    location: "Charlotte, NC",
    industry: "Technology",
  },
  {
    id: "demo-employer-finance",
    name: "Demo Financial Services Employer",
    location: "Charlotte, NC",
    industry: "Financial services",
  },
  {
    id: "demo-employer-healthcare",
    name: "Demo Healthcare Employer",
    location: "Charlotte, NC",
    industry: "Healthcare",
  },
];
