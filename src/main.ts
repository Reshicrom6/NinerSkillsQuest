import { courses, skills, skillsById } from "./data/catalog";
import { careerRoadmaps, employerProfiles } from "./data/careerGoals";
import { careerGoalStore } from "./state/careerGoalStore";
import { courseSelectionStore } from "./state/courseSelectionStore";
import { demoSessionStore } from "./state/demoSessionStore";
import { getRecommendationsForSkill } from "./data/recommendations";
import { combineSkillIds, compareTargetSkills } from "./data/skillGap";
import { recommendationStore } from "./state/recommendationStore";
import { experienceStore, validateExperience } from "./state/experienceStore";
import {
  experienceTypes,
  type ExperienceInput,
  type ExperienceValidationErrors,
} from "./types";
import "./style.css";

function getApplicationRoot(): HTMLDivElement {
  const element = document.querySelector<HTMLDivElement>("#root");
  if (!element) {
    throw new Error("Application root element was not found.");
  }
  return element;
}

const root = getApplicationRoot();
const announcer = document.querySelector<HTMLDivElement>("#announcer");
let searchQuery = "";
let draftCourseId = "";
let activeEntryTab: "course" | "experience" = "course";
let editingExperienceId: string | null = null;

let experienceDraft: ExperienceInput = {
  title: "",
  type: "",
  description: "",
  portfolioUrl: "",
  skillIds: [],
};

let experienceErrors: ExperienceValidationErrors = {};
type AppPage = "career-goal" | "courses" | "skill-review";

function getActivePage(): AppPage {
  const page = window.location.hash.slice(1);
  return page === "career-goal" || page === "skill-review" ? page : "courses";
}

function announce(message: string): void {
  if (announcer) {
    announcer.textContent = message;
  }
}

function getCareerGoalAnnouncementText(careerGoal: ReturnType<typeof careerGoalStore.getState>): string {
  if (!careerGoal.selectedRoadmapId && !careerGoal.selectedEmployerId) {
    return "Choose a career roadmap and a Charlotte employer to set your goal.";
  }

  if (!careerGoal.selectedRoadmapId) {
    return "Career employer selected. Choose a career roadmap to complete your goal.";
  }

  if (!careerGoal.selectedEmployerId) {
    return "Career roadmap selected. Choose a Charlotte employer to complete your goal.";
  }

  const roadmapName = careerGoal.selectedRoadmap?.name ?? "Selected roadmap";
  const employerName = careerGoal.selectedEmployer?.name ?? "Selected employer";
  const targetSkillNames =
    careerGoal.selectedRoadmap?.skillIds
      .map((skillId) => skillsById.get(skillId)?.name)
      .filter((skillName): skillName is string => Boolean(skillName)) ?? [];

  if (targetSkillNames.length === 0) {
    return `Career goal set to ${roadmapName} with ${employerName}. No target skills are mapped to this roadmap.`;
  }

  return `Career goal set to ${roadmapName} with ${employerName}. Target skills: ${targetSkillNames.join(", ")}.`;
}

function getSaveAnnouncementText(
  courseState: ReturnType<typeof courseSelectionStore.getState>,
  careerGoal: ReturnType<typeof careerGoalStore.getState>,
): string {
  const experienceState = experienceStore.getState();
  const courseMessage =
    courseState.persistenceMessage ??
    experienceState.persistenceMessage ??
    `${courseState.completedCourses.length} course${courseState.completedCourses.length === 1 ? "" : "s"} and ${experienceState.experiences.length} experience${experienceState.experiences.length === 1 ? "" : "s"} saved locally.`;

  if (!careerGoal.selectedRoadmapId || !careerGoal.selectedEmployerId) {
    const goalPrompt = getCareerGoalAnnouncementText(careerGoal);
    return `${courseMessage} ${goalPrompt}`;
  }

  const goalMessage =
    careerGoal.persistenceMessage ??
    `Career goal saved: ${careerGoal.selectedRoadmap?.name ?? "Selected roadmap"} with ${careerGoal.selectedEmployer?.name ?? "Selected employer"}.`;

  return `${courseMessage} ${goalMessage}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}
function resetExperienceDraft(): void {
  editingExperienceId = null;
  experienceDraft = {
    title: "",
    type: "",
    description: "",
    portfolioUrl: "",
    skillIds: [],
  };
  experienceErrors = {};
}

function clearExperienceFieldError(
  field: keyof ExperienceValidationErrors,
  control: HTMLElement,
): void {
  if (!experienceErrors[field]) {
    return;
  }

  delete experienceErrors[field];
  const errorId = `experience-${field}-error`;
  root.querySelector(`#${errorId}`)?.remove();
  control.removeAttribute("aria-invalid");
  const describedBy = control
    .getAttribute("aria-describedby")
    ?.split(/\s+/)
    .filter((id) => id !== errorId);
  if (describedBy?.length) {
    control.setAttribute("aria-describedby", describedBy.join(" "));
  } else {
    control.removeAttribute("aria-describedby");
  }
}

function renderExperienceForm(): string {
  const selectedSkillIds = new Set(experienceDraft.skillIds);
  const availableSkills = skills.filter((skill) => !selectedSkillIds.has(skill.id));
  const renderError = (field: keyof ExperienceValidationErrors) =>
    experienceErrors[field]
      ? `<p class="field-error" id="experience-${field}-error" role="alert">${escapeHtml(experienceErrors[field] ?? "")}</p>`
      : "";
  const describedBy = (field: keyof ExperienceValidationErrors, helpId?: string) =>
    [helpId, experienceErrors[field] ? `experience-${field}-error` : ""]
      .filter(Boolean)
      .join(" ");

  return `
    <form id="experience-form" class="course-form" novalidate>
      <div class="field">
        <label for="experience-title">Project or experience name</label>
        <input
          id="experience-title"
          data-focus-target="experience-title"
          name="title"
          type="text"
          value="${escapeHtml(experienceDraft.title)}"
          aria-required="true"
          ${experienceErrors.title ? 'aria-invalid="true"' : ""}
          ${describedBy("title") ? `aria-describedby="${describedBy("title")}"` : ""}
        />
        ${renderError("title")}
      </div>

      <div class="field">
        <label for="experience-type">Type</label>
        <select
          id="experience-type"
          data-focus-target="experience-type"
          name="type"
          aria-required="true"
          ${experienceErrors.type ? 'aria-invalid="true"' : ""}
          ${describedBy("type") ? `aria-describedby="${describedBy("type")}"` : ""}
        >
          <option value="">Select a type</option>
          ${experienceTypes
            .map(
              (type) =>
                `<option value="${escapeHtml(type)}" ${experienceDraft.type === type ? "selected" : ""}>${escapeHtml(type)}</option>`,
            )
            .join("")}
        </select>
        ${renderError("type")}
      </div>

      <div class="field">
        <label for="experience-description">What did you build or do?</label>
        <textarea
          id="experience-description"
          data-focus-target="experience-description"
          name="description"
          rows="3"
        >${escapeHtml(experienceDraft.description)}</textarea>
      </div>

      <div class="field">
        <label for="experience-portfolio-url">Repository or portfolio link · optional</label>
        <input
          id="experience-portfolio-url"
          data-focus-target="experience-portfolio-url"
          name="portfolioUrl"
          type="url"
          value="${escapeHtml(experienceDraft.portfolioUrl)}"
          ${experienceErrors.portfolioUrl ? 'aria-invalid="true"' : ""}
          ${describedBy("portfolioUrl", "experience-portfolio-help") ? `aria-describedby="${describedBy("portfolioUrl", "experience-portfolio-help")}"` : ""}
        />
        <p id="experience-portfolio-help" class="field-help">Add a valid http or https link, if available.</p>
        ${renderError("portfolioUrl")}
      </div>

      <div class="field experience-skills-field">
        <label for="experience-skill-select">Skills practiced</label>
        <div class="skill-picker">
          <select
            id="experience-skill-select"
            data-focus-target="experience-skill-select"
            aria-required="true"
            ${experienceErrors.skillIds ? 'aria-invalid="true"' : ""}
            ${describedBy("skillIds") ? `aria-describedby="${describedBy("skillIds")}"` : ""}
          >
            <option value="">Select a supported skill</option>
            ${availableSkills
              .map(
                (skill) =>
                  `<option value="${escapeHtml(skill.id)}">${escapeHtml(skill.name)}</option>`,
              )
              .join("")}
          </select>
          <button class="text-button" type="button" data-add-experience-skill ${
            availableSkills.length === 0 ? "disabled" : ""
          }>Add skill</button>
        </div>
        ${
          experienceDraft.skillIds.length > 0
            ? `<ul class="skill-tags selected-experience-skills" aria-label="Selected skills">
                ${experienceDraft.skillIds
                  .map((skillId) => {
                    const skill = skills.find((candidate) => candidate.id === skillId);
                    return skill
                      ? `<li>
                          <span>${escapeHtml(skill.name)}</span>
                          <button
                            class="skill-remove-button"
                            type="button"
                            data-remove-experience-skill="${escapeHtml(skill.id)}"
                            aria-label="Remove ${escapeHtml(skill.name)} skill"
                          >×</button>
                        </li>`
                      : "";
                  })
                  .join("")}
              </ul>`
            : ""
        }
        ${renderError("skillIds")}
      </div>

      <div class="experience-form-actions">
        <button class="button button-secondary" type="submit">
          ${editingExperienceId ? "Save changes" : "Add project to list"}
        </button>
        ${
          editingExperienceId
            ? `<button class="text-button" type="button" data-cancel-experience-edit>Cancel edit</button>`
            : ""
        }
      </div>
    </form>
  `;
}

function renderExperienceInventory(
  experienceState: ReturnType<typeof experienceStore.getState>,
): string {
  if (experienceState.experiences.length === 0) {
    return `<p class="mapped-empty">No projects or experiences added yet.</p>`;
  }

  return `
    <ul class="selected-list">
      ${experienceState.experiences
        .map(
          (experience) => `
            <li class="selected-course experience-card">
              <div class="selected-course-copy">
                <h3>${escapeHtml(experience.title)}</h3>
                <p>${escapeHtml(experience.type)} · <span class="self-reported-label">Self-reported</span></p>
                ${
                  experience.description
                    ? `<p class="experience-description">${escapeHtml(experience.description)}</p>`
                    : ""
                }
                ${
                  experience.portfolioUrl
                    ? `<p><a href="${escapeHtml(experience.portfolioUrl)}" target="_blank" rel="noopener noreferrer">Repository or portfolio</a></p>`
                    : ""
                }
                <ul class="skill-tags" aria-label="Skills for ${escapeHtml(experience.title)}">
                  ${experience.skillIds
                    .map((skillId) => {
                      const skill = skillsById.get(skillId);
                      return skill ? `<li>${escapeHtml(skill.name)}</li>` : "";
                    })
                    .join("")}
                </ul>
              </div>
              <div class="experience-item-actions">
                <button
                  class="text-button"
                  type="button"
                  data-edit-experience="${escapeHtml(experience.id)}"
                  aria-label="Edit ${escapeHtml(experience.title)}"
                >Edit</button>
                <button
                  class="text-button remove-button"
                  type="button"
                  data-remove-experience="${escapeHtml(experience.id)}"
                  aria-label="Remove ${escapeHtml(experience.title)}"
                >Remove</button>
              </div>
            </li>`,
        )
        .join("")}
    </ul>
  `;
}

function render(focusTarget?: string): void {
  const session = demoSessionStore.getState();
  if (!session.signedIn) {
    root.innerHTML = `
      <main class="app-shell sign-in-shell" aria-labelledby="page-title">
        <header class="panel-heading">
          <div>
            <h1 id="page-title">Niner Skills Quest</h1>
            <p>Start a local demo session to explore the course and career-goal prototype.</p>
          </div>
          <span class="demo-badge">Local demo</span>
        </header>
        <section class="sign-in-card" aria-labelledby="sign-in-title">
          <h2 id="sign-in-title">Demo access</h2>
          <p>This prototype does not authenticate identities or protect personal data. Use sample information only.</p>
          <button class="button button-primary demo-sign-in" type="button">Start local demo</button>
          ${session.message ? `<p class="storage-message" role="alert">${escapeHtml(session.message)}</p>` : ""}
        </section>
      </main>
    `;
    root.querySelector<HTMLButtonElement>(".demo-sign-in")?.addEventListener("click", () => {
      demoSessionStore.startDemoSession();
    });
    return;
  }

  const activePage = getActivePage();
  const pageHeading = {
    "career-goal": {
      title: "Choose your career goal",
      description: "Choose a direction to compare your course skills against.",
    },
    courses: {
      title: "Add what you already know",
      description: "Add completed courses and review their suggested skills.",
    },
    "skill-review": {
      title: "Review your skills",
      description: "Compare course-mapped skills with your career goal.",
    },
  }[activePage];
  const state = courseSelectionStore.getState();
  const careerGoal = careerGoalStore.getState();
  const experienceState = experienceStore.getState();
  const selectedIds = new Set(state.completedCourseIds);
  const availableCourses = courses.filter((course) => !selectedIds.has(course.id));
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchingCourses = availableCourses.filter((course) =>
    `${course.code} ${course.title}`.toLowerCase().includes(normalizedQuery),
  );
  const exactMatch = matchingCourses.find(
    (course) =>
      course.code.toLowerCase() === normalizedQuery ||
      course.title.toLowerCase() === normalizedQuery,
  );
  if (exactMatch) {
    draftCourseId = exactMatch.id;
  } else if (draftCourseId && !matchingCourses.some((course) => course.id === draftCourseId)) {
    draftCourseId = "";
  }

  const draftCourse = courses.find((course) => course.id === draftCourseId);
  const hasSearchResults = Boolean(
    normalizedQuery && !draftCourse && matchingCourses.length > 0,
  );
  const draftSkills =
    draftCourse?.skillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill)) ?? [];
  const targetSkills =
    careerGoal.selectedRoadmap?.skillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill)) ?? [];
  const skillComparison = compareTargetSkills(
    combineSkillIds(
      state.skills.map((skill) => skill.id),
      experienceState.skills.map((skill) => skill.id),
    ),
    careerGoal.targetProfile?.skillIds ?? null,
  );
  recommendationStore.setMissingSkillIds(skillComparison.unmatchedTargetSkillIds);
  const recommendationState = recommendationStore.getState();
  const selectedMissingSkillId = recommendationState.selectedSkillId;
  const selectedRecommendation =
    selectedMissingSkillId !== null ? getRecommendationsForSkill(selectedMissingSkillId) : null;
  const getSkillNames = (skillIds: string[]) =>
    skillIds.map((skillId) => skillsById.get(skillId)?.name ?? skillId);
  const careerGoalPrompt =
    !careerGoal.selectedRoadmapId && !careerGoal.selectedEmployerId
      ? "Choose a career roadmap and a Charlotte employer to set your goal."
      : !careerGoal.selectedRoadmapId
        ? "Choose a career roadmap to complete your goal."
        : !careerGoal.selectedEmployerId
          ? "Choose a Charlotte employer to complete your goal."
          : "";
  const searchHelp =
    courses.length === 0
      ? "No supported courses are available in this demo yet."
      : availableCourses.length === 0
        ? "You have added every supported demo course."
        : normalizedQuery && matchingCourses.length === 0
          ? "No matching courses. Try another code or name."
          : normalizedQuery && !draftCourse
            ? `${matchingCourses.length} matching course${matchingCourses.length === 1 ? "" : "s"}.`
            : "";
  const activeElement = document.activeElement;
  const activeFocusTarget =
    focusTarget ??
    (activeElement instanceof HTMLElement ? activeElement.dataset.focusTarget : undefined);
  const selectionStart =
    activeElement instanceof HTMLInputElement ? activeElement.selectionStart : null;
  const selectionEnd =
    activeElement instanceof HTMLInputElement ? activeElement.selectionEnd : null;

  root.innerHTML = `
    <main class="app-shell" aria-labelledby="page-title">
      <header class="panel-heading">
        <div>
          <h1 id="page-title">${pageHeading.title}</h1>
          <p>${
            activePage === "courses" && activeEntryTab === "experience"
              ? "Projects and experience count as practice, too."
              : pageHeading.description
          }</p>
        </div>
        <div class="session-controls">
          <span class="demo-badge">Local demo session</span>
          <button class="text-button sign-out-button" type="button">Sign out</button>
        </div>
      </header>

      <nav class="page-navigation" aria-label="Main navigation">
        <a
          href="#career-goal"
          data-focus-target="page-career-goal"
          ${activePage === "career-goal" ? 'aria-current="page"' : ""}
        >
          Career goal
        </a>
        <a
          href="#courses"
          data-focus-target="page-courses"
          ${activePage === "courses" ? 'aria-current="page"' : ""}
        >
          Courses
        </a>
        <a
          href="#skill-review"
          data-focus-target="page-skill-review"
          ${activePage === "skill-review" ? 'aria-current="page"' : ""}
        >
          Skill review
        </a>
      </nav>

      <section
        class="career-goal feature-page"
        aria-labelledby="career-goal-title"
        ${activePage !== "career-goal" ? "hidden" : ""}
      >
        <div class="career-goal-heading">
          <h2 id="career-goal-title">Choose your career goal</h2>
          <p>Pick a roadmap and a Charlotte employer to define your target profile.</p>
        </div>
        <div class="goal-fields">
          <div class="field">
            <label for="career-roadmap">Career roadmap</label>
            <select
              id="career-roadmap"
              data-focus-target="career-roadmap"
              aria-describedby="career-goal-prompt"
            >
              <option value="">Select a roadmap</option>
              ${careerRoadmaps
                .map(
                  (roadmap) => `
                    <option
                      value="${escapeHtml(roadmap.id)}"
                      ${careerGoal.selectedRoadmapId === roadmap.id ? "selected" : ""}
                    >
                      ${escapeHtml(roadmap.name)}
                    </option>`,
                )
                .join("")}
            </select>
          </div>
          <div class="field">
            <label for="career-employer">Charlotte employer</label>
            <select
              id="career-employer"
              data-focus-target="career-employer"
              aria-describedby="career-goal-prompt"
            >
              <option value="">Select an employer</option>
              ${employerProfiles
                .map(
                  (employer) => `
                    <option
                      value="${escapeHtml(employer.id)}"
                      ${careerGoal.selectedEmployerId === employer.id ? "selected" : ""}
                    >
                      ${escapeHtml(employer.name)}
                    </option>`,
                )
                .join("")}
            </select>
          </div>
        </div>
        ${
          careerGoalPrompt
            ? `<p id="career-goal-prompt" class="goal-prompt" role="status">${escapeHtml(careerGoalPrompt)}</p>`
            : `<p id="career-goal-prompt" class="sr-only" role="status">Career goal selected.</p>`
        }
        ${
          careerGoal.targetProfile && careerGoal.selectedRoadmap && careerGoal.selectedEmployer
            ? `<div class="goal-summary" aria-live="polite">
                <p class="goal-summary-label">Current goal</p>
                <h3>${escapeHtml(careerGoal.selectedRoadmap.name)} · ${escapeHtml(careerGoal.selectedEmployer.name)}</h3>
                <p class="goal-employer-details">
                  ${escapeHtml(careerGoal.selectedEmployer.industry)} · ${escapeHtml(careerGoal.selectedEmployer.location)}
                </p>
                <h4>Roadmap skill targets</h4>
                ${
                  targetSkills.length > 0
                    ? `<ul class="skill-tags goal-skill-tags" aria-label="Target skills for ${escapeHtml(careerGoal.selectedRoadmap.name)}">
                        ${targetSkills.map((skill) => `<li>${escapeHtml(skill.name)}</li>`).join("")}
                      </ul>`
                    : `<p class="goal-prompt">No target skills are currently mapped to this roadmap.</p>`
                }
              </div>`
            : ""
        }
        ${
          careerGoal.targetProfile
            ? `<p class="goal-status" aria-live="polite">${escapeHtml(getCareerGoalAnnouncementText(careerGoal))}</p>`
            : ""
        }
        <p class="goal-demo-note">
          Employer profiles and target skill mappings are illustrative local-demo data.
        </p>
      </section>

      <section
        class="course-workflow feature-page"
        aria-label="Add completed courses"
        ${activePage !== "courses" ? "hidden" : ""}
      >
      <nav class="entry-tabs" aria-label="Experience type">
        <button
          class="entry-tab ${activeEntryTab === "course" ? "is-active" : ""}"
          type="button"
          data-entry-tab="course"
          ${activeEntryTab === "course" ? 'aria-current="page"' : ""}
        >Course</button>
        <button
          class="entry-tab ${activeEntryTab === "experience" ? "is-active" : ""}"
          type="button"
          data-entry-tab="experience"
          ${activeEntryTab === "experience" ? 'aria-current="page"' : ""}
        >
          Project or experience
        </button>
      </nav>

      ${
        activeEntryTab === "course"
          ? `
      <form id="course-form" class="course-form">
        <div class="field search-field">
          <label for="course-search">Search by course code or name</label>
          <input
            id="course-search"
            data-focus-target="course-search"
            type="search"
            value="${escapeHtml(searchQuery)}"
            placeholder="Search supported courses"
            autocomplete="off"
            ${hasSearchResults ? 'aria-controls="course-search-results"' : ""}
            aria-describedby="course-search-help"
          />
          ${
            searchHelp
              ? `<p id="course-search-help" class="field-help">${escapeHtml(searchHelp)}</p>`
              : ""
          }
          ${
            hasSearchResults
              ? `<ul id="course-search-results" class="search-results" aria-label="Matching supported courses">
                  ${matchingCourses
                    .map(
                      (course) => `
                        <li>
                          <button
                            class="search-result"
                            type="button"
                            data-select-course="${escapeHtml(course.id)}"
                          >
                            <span class="search-result-code">${escapeHtml(course.code)}</span>
                            <span>${escapeHtml(course.title)}</span>
                          </button>
                        </li>`,
                    )
                    .join("")}
                </ul>`
              : ""
          }
        </div>

        ${
          draftCourse
            ? `<section class="course-preview" aria-label="Selected course">
                <h2>${escapeHtml(draftCourse.code)} — ${escapeHtml(draftCourse.title)}</h2>
                <p>UNC Charlotte · course label from your existing pathway</p>
                <span class="selected-tag">✓ Selected course</span>
              </section>`
            : ""
        }

        ${
          draftCourse
            ? `<section class="course-status" aria-labelledby="status-title">
                <h2 id="status-title">Course status</h2>
                <div class="status-tags">
                  <span class="status-tag is-completed">● Completed</span>
                  <span
                    class="status-tag is-unavailable"
                    aria-label="In progress status is outside this completed-course demo"
                    title="This feature only tracks completed courses."
                  >
                    ○ In progress
                  </span>
                </div>
              </section>`
            : ""
        }

        ${
          draftCourse
            ? `<section class="suggested-skills" aria-labelledby="suggested-title">
                <h2 id="suggested-title">Review suggested skills</h2>
                <p>Suggested skills are based on the course mapping, not verified mastery.</p>
                ${
                  draftSkills.length > 0
                    ? `<ul class="skill-tags" aria-label="Skills suggested by this course">
                        ${draftSkills.map((skill) => `<li>${escapeHtml(skill.name)}</li>`).join("")}
                      </ul>`
                    : `<p class="skill-empty">No mapped skills are available for this course yet.</p>`
                }
                <p class="skill-source-note">Mapped from the supported course catalog.</p>
              </section>`
            : ""
        }

        <button class="button button-secondary add-button" type="submit" ${
          draftCourse ? "" : "disabled"
        }>
          Add course to list
        </button>
      </form>

      <section class="added-items" aria-labelledby="added-title">
        <h2 id="added-title">Added items · ${state.completedCourses.length}</h2>
        ${
          state.completedCourses.length > 0
            ? `<ul class="selected-list">
                ${state.completedCourses
                  .map((course) => {
                    const courseSkills = course.skillIds
                      .map((skillId) => skillsById.get(skillId)?.name)
                      .filter((name): name is string => Boolean(name));
                    return `
                      <li class="selected-course">
                        <div class="selected-course-copy">
                          <h3>${escapeHtml(course.code)} — ${escapeHtml(course.title)}</h3>
                          <p>Completed${courseSkills.length > 0
                            ? ` · ${courseSkills.map(escapeHtml).join(", ")}`
                            : ""}</p>
                        </div>
                        <button
                          class="text-button remove-button"
                          type="button"
                          data-remove-course="${escapeHtml(course.id)}"
                          aria-label="Remove ${escapeHtml(course.code)} — ${escapeHtml(course.title)}"
                        >
                          Remove
                        </button>
                      </li>`;
                  })
                  .join("")}
              </ul>
              <div class="added-skills" aria-labelledby="mapped-title">
                <h3 id="mapped-title">Mapped skills · ${state.skills.length}</h3>
                ${
                  state.skills.length > 0
                    ? `<ul class="skill-tags" aria-label="Mapped skills from completed courses">
                        ${state.skills.map((skill) => `<li>${escapeHtml(skill.name)}</li>`).join("")}
                      </ul>`
                    : `<p class="mapped-empty">No mapped skills are available for the selected courses.</p>`
                }
              </div>`
            : draftCourse
              ? ""
              : `<p class="mapped-empty">No courses selected yet. Add a supported course to see its mapped skills.</p>`
        }
      </section>
          `
          : `
      ${renderExperienceForm()}
      <section class="added-items" aria-labelledby="experience-added-title">
        <h2 id="experience-added-title">Added items · ${experienceState.experiences.length}</h2>
        ${renderExperienceInventory(experienceState)}
      </section>
      <p class="disclaimer">
        Your description and selected skills are self-reported. A portfolio link provides context, not automatic skill verification.
      </p>
          `
      }
      </section>

      <section
        class="skill-review-workflow feature-page"
        aria-label="Skill comparison and recommendations"
        ${activePage !== "skill-review" ? "hidden" : ""}
      >
      <section class="skill-gap" aria-labelledby="skill-gap-title" aria-live="polite">
        <h2 id="skill-gap-title">Compare your skills with your goal</h2>
        ${
          skillComparison.status === "missing-goal"
            ? `<p class="goal-prompt">Choose a career roadmap and employer to compare your recorded skills.</p>`
            : skillComparison.status === "empty-target"
              ? `<p class="goal-prompt">This career goal has no target skills to compare yet.</p>`
              : `
                <p class="skill-gap-note">
                  Course mappings and self-reported experience show possible exposure only. A target skill not recorded here does not mean you lack it.
                </p>
                <div class="skill-gap-group">
                  <h3>Matches · ${skillComparison.matchedSkillIds.length}</h3>
                  ${
                    skillComparison.matchedSkillIds.length > 0
                      ? `<ul class="skill-tags" aria-label="Target skills matched by recorded skills">
                          ${getSkillNames(skillComparison.matchedSkillIds).map((name) => `<li>${escapeHtml(name)}</li>`).join("")}
                        </ul>`
                      : `<p class="mapped-empty">No target skills match the currently recorded skills.</p>`
                  }
                </div>
                <div class="skill-gap-group">
                  <h3>Not recorded · ${skillComparison.unmatchedTargetSkillIds.length}</h3>
                  ${
                    skillComparison.unmatchedTargetSkillIds.length > 0
                      ? `<ul class="skill-tags goal-skill-tags" aria-label="Target skills not recorded">
                          ${getSkillNames(skillComparison.unmatchedTargetSkillIds).map((name) => `<li>${escapeHtml(name)}</li>`).join("")}
                        </ul>`
                      : `<p class="mapped-empty">Every target skill is represented in the current recorded skills.</p>`
                  }
                </div>
              `
        }
      </section>

      ${
        skillComparison.status === "ready" && recommendationState.availableSkillIds.length > 0
          ? `
            <section class="recommendations" aria-labelledby="recommendations-title">
              <h2 id="recommendations-title">Missing-skill recommendations</h2>
              <div class="field">
                <label for="recommendation-skill">Choose a missing skill</label>
                <select id="recommendation-skill" data-focus-target="recommendation-skill">
                  ${recommendationState.availableSkillIds
                    .map(
                      (skillId) => `
                        <option value="${escapeHtml(skillId)}" ${selectedMissingSkillId === skillId ? "selected" : ""}>
                          ${escapeHtml(skillsById.get(skillId)?.name ?? skillId)}
                        </option>`,
                    )
                    .join("")}
                </select>
              </div>
              ${
                selectedRecommendation
                  ? `
                    <div class="recommendation-panel">
                      <div class="recommendation-group">
                        <h3>UNC Charlotte electives</h3>
                        ${
                          selectedRecommendation.electives.length > 0
                            ? `<ul class="skill-tags">
                                ${selectedRecommendation.electives
                                  .map(
                                    (course) => `
                                      <li>
                                        <a href="${escapeHtml(course.url)}" target="_blank" rel="noreferrer">${escapeHtml(course.code)} — ${escapeHtml(course.title)}</a>
                                      </li>`,
                                  )
                                  .join("")}
                              </ul>`
                            : `<p class="mapped-empty">No UNC Charlotte electives are available for this skill yet.</p>`
                        }
                      </div>
                      <div class="recommendation-group">
                        <h3>Practice resources</h3>
                        ${
                          selectedRecommendation.resources.length > 0
                            ? `<ul class="skill-tags goal-skill-tags">
                                ${selectedRecommendation.resources
                                  .map(
                                    (resource) => `
                                      <li>
                                        <a href="${escapeHtml(resource.url)}" target="_blank" rel="noreferrer">${escapeHtml(resource.title)}</a>
                                      </li>`,
                                  )
                                  .join("")}
                              </ul>`
                            : `<p class="mapped-empty">No practice resources are available for this selected skill yet.</p>`
                        }
                      </div>
                    </div>
                  `
                  : `<p class="mapped-empty">No course or resource is available for this selected skill.</p>`
              }
            </section>
          `
          : skillComparison.status === "ready"
            ? `
              <section class="recommendations" aria-labelledby="recommendations-title">
                <h2 id="recommendations-title">Missing-skill recommendations</h2>
                <p class="mapped-empty">No missing skills are available for recommendations right now.</p>
              </section>
            `
            : ""
      }
      </section>

      <button class="button button-primary save-button" type="button">
        Save and continue →
      </button>

      <p class="disclaimer">
        Coursework suggests exposure, not verified mastery. Course availability and
        requirements must be checked in the official catalog.
      </p>
      ${[session.message, state.persistenceMessage, experienceState.persistenceMessage, careerGoal.persistenceMessage]
        .filter((message): message is string => message !== null)
        .map((message) => `<p class="storage-message" role="status">${escapeHtml(message)}</p>`)
        .join("")}
    </main>
  `;

  if (activeFocusTarget) {
    const nextFocus = root.querySelector<HTMLElement>(
      `[data-focus-target="${activeFocusTarget}"]`,
    );
    nextFocus?.focus();
    if (
      nextFocus instanceof HTMLInputElement &&
      selectionStart !== null &&
      selectionEnd !== null
    ) {
      nextFocus.setSelectionRange(selectionStart, selectionEnd);
    }
  }

  root.querySelectorAll<HTMLButtonElement>("[data-entry-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.entryTab;
      if (tab === "course" || tab === "experience") {
        activeEntryTab = tab;
        render();
      }
    });
  });

  const searchInput = root.querySelector<HTMLInputElement>("#course-search");
  searchInput?.addEventListener("input", () => {
    searchQuery = searchInput.value;
    draftCourseId = "";
    render("course-search");
  });

  root.querySelectorAll<HTMLButtonElement>("[data-select-course]").forEach((button) => {
    button.addEventListener("click", () => {
      const courseId = button.dataset.selectCourse;
      if (courseId) {
        draftCourseId = courseId;
        render("course-search");
      }
    });
  });

  root.querySelector<HTMLFormElement>("#course-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const course = courses.find((candidate) => candidate.id === draftCourseId);
    if (!course) {
      return;
    }

    searchQuery = "";
    draftCourseId = "";
    courseSelectionStore.addCourse(course.id);
    announce(`Added ${course.code} — ${course.title}.`);
  });

  const experienceTitle = root.querySelector<HTMLInputElement>("#experience-title");
  experienceTitle?.addEventListener("input", () => {
    experienceDraft.title = experienceTitle.value;
    clearExperienceFieldError("title", experienceTitle);
  });
  const experienceType = root.querySelector<HTMLSelectElement>("#experience-type");
  experienceType?.addEventListener("change", () => {
    experienceDraft.type = experienceType.value;
    clearExperienceFieldError("type", experienceType);
  });
  const experienceDescription = root.querySelector<HTMLTextAreaElement>(
    "#experience-description",
  );
  experienceDescription?.addEventListener("input", () => {
    experienceDraft.description = experienceDescription.value;
  });
  const experiencePortfolioUrl = root.querySelector<HTMLInputElement>(
    "#experience-portfolio-url",
  );
  experiencePortfolioUrl?.addEventListener("input", () => {
    experienceDraft.portfolioUrl = experiencePortfolioUrl.value;
    clearExperienceFieldError("portfolioUrl", experiencePortfolioUrl);
  });

  root.querySelector<HTMLButtonElement>("[data-add-experience-skill]")?.addEventListener(
    "click",
    () => {
      const select = root.querySelector<HTMLSelectElement>("#experience-skill-select");
      const skillId = select?.value;
      if (!select || !skillId || experienceDraft.skillIds.includes(skillId)) {
        return;
      }

      experienceDraft.skillIds = [...experienceDraft.skillIds, skillId];
      clearExperienceFieldError("skillIds", select);
      render("experience-skill-select");
    },
  );

  root.querySelectorAll<HTMLButtonElement>("[data-remove-experience-skill]").forEach((button) => {
    button.addEventListener("click", () => {
      const skillId = button.dataset.removeExperienceSkill;
      const select = root.querySelector<HTMLSelectElement>("#experience-skill-select");
      if (skillId) {
        experienceDraft.skillIds = experienceDraft.skillIds.filter((id) => id !== skillId);
        if (select) {
          clearExperienceFieldError("skillIds", select);
        }
        render("experience-skill-select");
      }
    });
  });

  root.querySelector<HTMLFormElement>("#experience-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    experienceErrors = validateExperience(experienceDraft);
    if (Object.keys(experienceErrors).length > 0) {
      const firstInvalidField: Record<keyof ExperienceValidationErrors, string> = {
        title: "experience-title",
        type: "experience-type",
        skillIds: "experience-skill-select",
        portfolioUrl: "experience-portfolio-url",
      };
      const firstInvalidKey = (
        ["title", "type", "skillIds", "portfolioUrl"] as const
      ).find((field) => experienceErrors[field]);
      render(firstInvalidKey ? firstInvalidField[firstInvalidKey] : "experience-title");
      return;
    }

    const experienceId = editingExperienceId;
    const title = experienceDraft.title.trim();
    const submittedExperience: ExperienceInput = {
      ...experienceDraft,
      skillIds: [...experienceDraft.skillIds],
    };
    resetExperienceDraft();
    if (experienceId) {
      experienceStore.updateExperience(experienceId, submittedExperience);
      announce(`Updated ${title}.`);
    } else {
      experienceStore.addExperience(submittedExperience);
      announce(`Added ${title} as a self-reported experience.`);
    }
  });

  root.querySelectorAll<HTMLButtonElement>("[data-edit-experience]").forEach((button) => {
    button.addEventListener("click", () => {
      const experience = experienceStore
        .getState()
        .experiences.find((entry) => entry.id === button.dataset.editExperience);
      if (!experience) {
        return;
      }

      editingExperienceId = experience.id;
      activeEntryTab = "experience";
      experienceDraft = {
        title: experience.title,
        type: experience.type,
        description: experience.description,
        portfolioUrl: experience.portfolioUrl ?? "",
        skillIds: [...experience.skillIds],
      };
      experienceErrors = {};
      render("experience-title");
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-remove-experience]").forEach((button) => {
    button.addEventListener("click", () => {
      const experienceId = button.dataset.removeExperience;
      const experience = experienceStore
        .getState()
        .experiences.find((entry) => entry.id === experienceId);
      if (!experienceId || !experience) {
        return;
      }

      if (editingExperienceId === experienceId) {
        resetExperienceDraft();
      }
      experienceStore.removeExperience(experienceId);
      announce(`Removed ${experience.title}.`);
    });
  });

  root.querySelector<HTMLButtonElement>("[data-cancel-experience-edit]")?.addEventListener(
    "click",
    () => {
      resetExperienceDraft();
      render("experience-title");
    },
  );

  root.querySelector<HTMLSelectElement>("#recommendation-skill")?.addEventListener("change", (event) => {
    const select = event.currentTarget;
    if (select instanceof HTMLSelectElement) {
      recommendationStore.setSelectedSkillId(select.value || null);
      render("recommendation-skill");
    }
  });

  root.querySelector<HTMLSelectElement>("#career-roadmap")?.addEventListener("change", (event) => {
    const select = event.currentTarget;
    if (select instanceof HTMLSelectElement) {
      careerGoalStore.selectRoadmap(select.value || null);
      const updatedGoal = careerGoalStore.getState();
      const selectedRoadmap = updatedGoal.selectedRoadmap?.name ?? "selected roadmap";
      const employerStatus = updatedGoal.selectedEmployer
        ? ` with ${updatedGoal.selectedEmployer.name} selected.`
        : ".";
      announce(`Career roadmap changed to ${selectedRoadmap}${employerStatus}`);
    }
  });

  root.querySelector<HTMLSelectElement>("#career-employer")?.addEventListener("change", (event) => {
    const select = event.currentTarget;
    if (select instanceof HTMLSelectElement) {
      careerGoalStore.selectEmployer(select.value || null);
      const updatedGoal = careerGoalStore.getState();
      const employerName = updatedGoal.selectedEmployer?.name ?? "selected employer";
      const roadmapStatus = updatedGoal.selectedRoadmap
        ? ` for ${updatedGoal.selectedRoadmap.name}.`
        : ".";
      announce(`Career employer changed to ${employerName}${roadmapStatus}`);
    }
  });

  root.querySelectorAll<HTMLButtonElement>("[data-remove-course]").forEach((button) => {
    button.addEventListener("click", () => {
      const courseId = button.dataset.removeCourse;
      const course = courses.find((candidate) => candidate.id === courseId);
      if (courseId) {
        courseSelectionStore.removeCourse(courseId);
        if (course) {
          announce(`Removed ${course.code} — ${course.title}.`);
        }
      }
    });
  });

  root.querySelector<HTMLButtonElement>(".save-button")?.addEventListener("click", () => {
    announce(getSaveAnnouncementText(state, careerGoal));
  });

  root.querySelector<HTMLButtonElement>(".sign-out-button")?.addEventListener("click", () => {
    demoSessionStore.signOut();
  });
}

courseSelectionStore.subscribe(() => render("course-search"));
experienceStore.subscribe(() => render());
careerGoalStore.subscribe(() => render());
demoSessionStore.subscribe(() => render());
window.addEventListener("hashchange", () => render());
render();
