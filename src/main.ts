import { courses, skills, skillsById } from "./data/catalog";
import { careerRoadmaps, employerProfiles } from "./data/careerGoals";
import {
  getItineraryRecommendations,
  getItinerarySkillNames,
} from "./data/itinerary";
import { courseCatalogUrl, getLearningOptions } from "./data/learningOptions";
import { parseTranscriptPdf, type TranscriptCourseCandidate } from "./data/transcript";
import { careerGoalStore } from "./state/careerGoalStore";
import { courseSelectionStore } from "./state/courseSelectionStore";
import { demoSessionStore } from "./state/demoSessionStore";
import {
  experienceStore,
  experienceTypes,
  type ExperienceValidationErrors,
} from "./state/experienceStore";
import { itineraryStore } from "./state/itineraryStore";
import { compareTargetSkills } from "./data/skillGap";
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
let selectedLearningSkillId = "";
let transcriptCandidates: TranscriptCourseCandidate[] = [];
let selectedTranscriptCourseIds = new Set<string>();
let transcriptMessage: string | null = null;
let transcriptIsParsing = false;
let transcriptAttempt = 0;
let transcriptAbortController: AbortController | null = null;
let experienceTitleDraft = "";
let experienceTypeDraft = "";
let experienceSkillDrafts = new Set<string>();
let editingExperienceId: string | null = null;
let experienceFormErrors: ExperienceValidationErrors | null = null;

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
  experienceState: ReturnType<typeof experienceStore.getState>,
  itineraryState: ReturnType<typeof itineraryStore.getState>,
): string {
  const courseMessage =
    courseState.persistenceMessage ??
    `${courseState.completedCourses.length} course${courseState.completedCourses.length === 1 ? "" : "s"} saved locally.`;
  const experienceMessage =
    experienceState.persistenceMessage ??
    `${experienceState.experiences.length} self-reported experience${experienceState.experiences.length === 1 ? "" : "s"} saved locally.`;
  const itineraryMessage =
    itineraryState.persistenceMessage ??
    `${itineraryState.activities.length} itinerary ${itineraryState.activities.length === 1 ? "activity" : "activities"} saved in this browser.`;

  if (!careerGoal.selectedRoadmapId || !careerGoal.selectedEmployerId) {
    const goalPrompt = getCareerGoalAnnouncementText(careerGoal);
    return `${courseMessage} ${experienceMessage} ${itineraryMessage} ${goalPrompt}`;
  }

  const goalMessage =
    careerGoal.persistenceMessage ??
    `Career goal saved: ${careerGoal.selectedRoadmap?.name ?? "Selected roadmap"} with ${careerGoal.selectedEmployer?.name ?? "Selected employer"}.`;

  return `${courseMessage} ${experienceMessage} ${itineraryMessage} ${goalMessage}`;
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

async function reviewTranscript(file: File): Promise<void> {
  transcriptAbortController?.abort();
  const attempt = ++transcriptAttempt;
  const abortController = new AbortController();
  transcriptAbortController = abortController;
  transcriptCandidates = [];
  selectedTranscriptCourseIds = new Set();
  transcriptMessage = "Reading this PDF in your browser. Nothing has been saved.";
  transcriptIsParsing = true;
  render();

  try {
    const candidates = await parseTranscriptPdf(file, courses, abortController.signal);
    if (attempt !== transcriptAttempt) {
      return;
    }
    transcriptCandidates = candidates;
    selectedTranscriptCourseIds = new Set(
      candidates
        .flatMap((candidate) =>
          candidate.status === "candidate" && candidate.courseId ? [candidate.courseId] : [],
        ),
    );
    transcriptMessage =
      candidates.length > 0
        ? "Review the extracted courses. Nothing changes until you confirm."
        : "No recognizable course records were found. Use manual course entry instead.";
  } catch (error) {
    if (attempt !== transcriptAttempt) {
      return;
    }
    transcriptMessage =
      error instanceof Error
        ? `${error.message} Use manual course entry instead.`
        : "The PDF could not be read. Use manual course entry instead.";
  } finally {
    if (attempt === transcriptAttempt) {
      transcriptIsParsing = false;
      transcriptAbortController = null;
      render();
    }
  }
}

function discardTranscriptReview(): void {
  transcriptAbortController?.abort();
  transcriptAbortController = null;
  transcriptAttempt += 1;
  transcriptCandidates = [];
  selectedTranscriptCourseIds = new Set();
  transcriptMessage = "Transcript preview discarded. Saved courses were not changed.";
  transcriptIsParsing = false;
  render();
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

  const state = courseSelectionStore.getState();
  const careerGoal = careerGoalStore.getState();
  const experienceState = experienceStore.getState();
  const itineraryState = itineraryStore.getState();
  const savedItineraryIds = new Set(
    itineraryState.activities.map((activity) => activity.id),
  );
  const experienceErrorMessages = experienceFormErrors
    ? Object.values(experienceFormErrors).filter((message): message is string => Boolean(message))
    : [];
  const recordedSkillIds = [...new Set([
    ...state.skills.map((skill) => skill.id),
    ...experienceState.skills.map((skill) => skill.id),
  ])];
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
    recordedSkillIds,
    careerGoal.targetProfile?.skillIds ?? null,
  );
  const getSkillNames = (skillIds: string[]) =>
    skillIds.map((skillId) => skillsById.get(skillId)?.name ?? skillId);
  if (!skillComparison.unmatchedTargetSkillIds.includes(selectedLearningSkillId)) {
    selectedLearningSkillId = "";
  }
  const selectedLearningOptions = selectedLearningSkillId
    ? getLearningOptions(selectedLearningSkillId)
    : null;
  const recommendedItineraryActivities = selectedLearningSkillId
    ? getItineraryRecommendations(selectedLearningSkillId, state.completedCourseIds)
    : [];
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
          <h1 id="page-title">Add what you already know</h1>
          <p>Add completed courses or self-reported experiences, then choose a career goal.</p>
        </div>
        <div class="session-controls">
          <span class="demo-badge">Local demo session</span>
          <button class="text-button sign-out-button" type="button">Sign out</button>
        </div>
      </header>

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
                <p>UNC Charlotte · sample course catalog entry</p>
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

      <section class="experience-panel" aria-labelledby="experience-panel-title">
        <h2 id="experience-panel-title">Record a custom experience</h2>
        <p class="experience-note">Skills you add here are labeled self-reported and are not independently verified.</p>
        ${
          experienceState.experiences.length > 0
            ? `<ul class="experience-list">
                ${experienceState.experiences
                  .map((experience) => `
                    <li class="experience-card">
                      <div class="experience-card-copy">
                        <h3>${escapeHtml(experience.title)}</h3>
                        <p>${escapeHtml(experience.type)} · Self-reported</p>
                        <ul class="skill-tags" aria-label="Self-reported skills">
                          ${experience.skillIds
                            .map((skillId) => skillsById.get(skillId)?.name)
                            .filter((name): name is string => Boolean(name))
                            .map((name) => `<li>${escapeHtml(name)}</li>`)
                            .join("")}
                        </ul>
                      </div>
                      <div class="experience-card-actions">
                        <button
                          class="text-button"
                          type="button"
                          data-edit-experience="${escapeHtml(experience.id)}"
                          aria-label="Edit ${escapeHtml(experience.title)}"
                        >Edit</button>
                        <button
                          class="text-button"
                          type="button"
                          data-remove-experience="${escapeHtml(experience.id)}"
                          aria-label="Remove ${escapeHtml(experience.title)}"
                        >Remove</button>
                      </div>
                    </li>`)
                  .join("")}
              </ul>`
            : `<p class="mapped-empty">No custom experiences recorded yet.</p>`
        }
        <form id="experience-form" class="experience-form" novalidate>
          <div class="field">
            <label for="experience-title">Experience title</label>
            <input
              id="experience-title"
              data-focus-target="experience-title"
              type="text"
              maxlength="100"
              value="${escapeHtml(experienceTitleDraft)}"
              aria-invalid="${experienceFormErrors?.title ? "true" : "false"}"
              ${experienceFormErrors?.title ? 'aria-describedby="experience-title-error"' : ""}
            />
            ${
              experienceFormErrors?.title
                ? `<p id="experience-title-error" class="field-error" role="alert">${escapeHtml(experienceFormErrors.title)}</p>`
                : ""
            }
          </div>
          <div class="field">
            <label for="experience-type">Experience type</label>
            <select
              id="experience-type"
              aria-invalid="${experienceFormErrors?.type ? "true" : "false"}"
              ${experienceFormErrors?.type ? 'aria-describedby="experience-type-error"' : ""}
            >
              <option value="">Select a type</option>
              ${experienceTypes
                .map((type) => `<option value="${type}" ${experienceTypeDraft === type ? "selected" : ""}>${type}</option>`)
                .join("")}
            </select>
            ${
              experienceFormErrors?.type
                ? `<p id="experience-type-error" class="field-error" role="alert">${escapeHtml(experienceFormErrors.type)}</p>`
                : ""
            }
          </div>
          <fieldset class="experience-skills">
            <legend>Skills represented by this experience</legend>
            <div class="experience-skill-options">
              ${skills
                .map((skill, index) => {
                  const checkboxId = `experience-skill-${index}`;
                  return `<div class="experience-skill-option">
                    <input
                      id="${checkboxId}"
                      type="checkbox"
                      data-experience-skill="${escapeHtml(skill.id)}"
                      ${experienceSkillDrafts.has(skill.id) ? "checked" : ""}
                    />
                    <label for="${checkboxId}">${escapeHtml(skill.name)}</label>
                  </div>`;
                })
                .join("")}
            </div>
            ${
              experienceFormErrors?.skillIds
                ? `<p class="field-error" role="alert">${escapeHtml(experienceFormErrors.skillIds)}</p>`
                : ""
            }
          </fieldset>
          <div class="experience-form-actions">
            <button class="button button-secondary" type="submit">
              ${editingExperienceId ? "Save changes" : "Add experience"}
            </button>
            ${
              editingExperienceId
                ? `<button class="text-button cancel-experience-edit" type="button">Cancel edit</button>`
                : ""
            }
          </div>
        </form>
        ${
          experienceState.persistenceMessage
            ? `<p class="storage-message" role="status">${escapeHtml(experienceState.persistenceMessage)}</p>`
            : ""
        }
        ${
          experienceErrorMessages.length > 0
            ? `<p class="sr-only" role="status">${experienceErrorMessages.map(escapeHtml).join(" ")}</p>`
            : ""
        }
      </section>

      <section class="transcript-panel" aria-labelledby="transcript-title">
        <h2 id="transcript-title">Review an unofficial transcript</h2>
        <p class="transcript-privacy">
          Privacy notice: this local demo parses the PDF in your browser. The raw file and extracted details are not uploaded or saved.
          Only course IDs you confirm are added to this browser's course list.
        </p>
        <label class="transcript-picker-label" for="transcript-file">Choose a PDF transcript</label>
        <input id="transcript-file" type="file" accept="application/pdf,.pdf" ${transcriptIsParsing ? "disabled" : ""} />
        <div class="transcript-drop" id="transcript-drop">
          <p>Or drag a PDF here to review it.</p>
          <button class="text-button sample-transcript-button" type="button" ${transcriptIsParsing ? "disabled" : ""}>
            Load synthetic sample PDF
          </button>
          ${
            transcriptIsParsing
              ? `<button class="text-button cancel-transcript" type="button">Cancel parsing</button>`
              : ""
          }
        </div>
        ${
          transcriptMessage
            ? `<p class="transcript-message" role="status">${escapeHtml(transcriptMessage)}</p>`
            : ""
        }
        ${
          transcriptCandidates.length > 0
            ? `<ul class="transcript-candidate-list">
                ${transcriptCandidates
                  .map((candidate, index) => {
                    if (candidate.status !== "candidate" || !candidate.courseId) {
                      return `<li class="transcript-excluded">
                        <strong>${escapeHtml(candidate.code)} ${escapeHtml(candidate.title)}</strong>
                        ${candidate.grade ? ` · grade ${escapeHtml(candidate.grade)}` : ""}
                        <span>${escapeHtml(candidate.reason ?? "Not eligible for import.")}</span>
                      </li>`;
                    }
                    const checkboxId = `transcript-course-${index}`;
                    return `<li class="transcript-candidate">
                      <input
                        id="${checkboxId}"
                        type="checkbox"
                        data-transcript-course="${escapeHtml(candidate.courseId)}"
                        ${selectedTranscriptCourseIds.has(candidate.courseId) ? "checked" : ""}
                      />
                      <label for="${checkboxId}">
                        ${escapeHtml(candidate.code)} ${escapeHtml(candidate.title)}
                        ${candidate.grade ? ` · grade ${escapeHtml(candidate.grade)}` : ""}
                      </label>
                    </li>`;
                  })
                  .join("")}
              </ul>
              <div class="transcript-actions">
                <button class="button button-primary confirm-transcript" type="button" ${
                  transcriptIsParsing || selectedTranscriptCourseIds.size === 0 ? "disabled" : ""
                }>Add selected courses</button>
                <button class="text-button discard-transcript" type="button">Discard preview</button>
              </div>`
            : ""
        }
        <button class="text-button manual-course-entry" type="button">Continue with manual course entry</button>
      </section>

      <section class="career-goal" aria-labelledby="career-goal-title">
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

      <section class="skill-gap" aria-labelledby="skill-gap-title" aria-live="polite">
        <h2 id="skill-gap-title">Compare your skills with your goal</h2>
        ${
          skillComparison.status === "missing-goal"
            ? `<p class="goal-prompt">Choose a career roadmap and employer to see how recorded course skills compare.</p>`
            : skillComparison.status === "empty-target"
              ? `<p class="goal-prompt">This career goal has no target skills to compare yet.</p>`
              : `
                <p class="skill-gap-note">
                  Course mappings and self-reported experiences indicate possible exposure only. A target skill not recorded here does not mean you lack it.
                </p>
                <div class="skill-gap-group">
                  <h3>Matches · ${skillComparison.matchedSkillIds.length}</h3>
                  ${
                    skillComparison.matchedSkillIds.length > 0
                      ? `<ul class="skill-tags" aria-label="Target skills matched by recorded courses">
                          ${getSkillNames(skillComparison.matchedSkillIds).map((name) => `<li>${escapeHtml(name)}</li>`).join("")}
                        </ul>`
                        : `<p class="mapped-empty">No target skills match the currently recorded inventory.</p>`
                  }
                </div>
                <div class="skill-gap-group">
                    <h3>Not recorded in this inventory · ${skillComparison.unmatchedTargetSkillIds.length}</h3>
                  ${
                    skillComparison.unmatchedTargetSkillIds.length > 0
                        ? `<ul class="skill-tags goal-skill-tags" aria-label="Target skills not recorded in this inventory">
                          ${getSkillNames(skillComparison.unmatchedTargetSkillIds).map((name) => `<li>${escapeHtml(name)}</li>`).join("")}
                        </ul>`
                        : `<p class="mapped-empty">Every target skill is represented in the current inventory.</p>`
                  }
                </div>
              `
        }
      </section>

      <section class="learning-options" aria-labelledby="learning-options-title">
        <h2 id="learning-options-title">Explore learning options</h2>
        ${
          skillComparison.status !== "ready"
            ? `<p class="goal-prompt">Choose a complete career goal before exploring options for target skills not recorded in this inventory.</p>`
            : skillComparison.unmatchedTargetSkillIds.length === 0
              ? `<p class="mapped-empty">There are no target skills currently unmatched by the inventory.</p>`
              : `
                <div class="field">
                  <label for="learning-skill">Choose a target skill not recorded in this inventory</label>
                  <select id="learning-skill" data-focus-target="learning-skill">
                    <option value="">Select a skill</option>
                    ${skillComparison.unmatchedTargetSkillIds
                      .map((skillId) => `
                        <option value="${escapeHtml(skillId)}" ${selectedLearningSkillId === skillId ? "selected" : ""}>
                          ${escapeHtml(skillsById.get(skillId)?.name ?? skillId)}
                        </option>`)
                      .join("")}
                  </select>
                </div>
                ${
                  selectedLearningSkillId
                    ? selectedLearningOptions
                      ? `
                        ${
                          selectedLearningOptions.catalogSearchTerm
                            ? `<p class="learning-catalog-note">
                                Suggested catalog topic: ${escapeHtml(selectedLearningOptions.catalogSearchTerm)}.
                                Verify current offerings and prerequisites in the
                                <a href="${courseCatalogUrl}" target="_blank" rel="noopener noreferrer">UNC Charlotte catalog</a>.
                              </p>`
                            : ""
                        }
                      `
                      : ""
                    : ""
                }
                ${
                  selectedLearningSkillId
                    ? `<div class="itinerary-recommendations">
                        <h3>Recommendations for ${escapeHtml(getItinerarySkillNames([selectedLearningSkillId]))}</h3>
                        ${
                          recommendedItineraryActivities.length > 0
                            ? `<ul class="itinerary-recommendation-list">
                                ${recommendedItineraryActivities
                                  .map((activity) => `
                                    <li class="itinerary-recommendation">
                                      <div class="itinerary-recommendation-copy">
                                        <h4>${escapeHtml(activity.name)}</h4>
                                        <p>${escapeHtml(activity.type)} · ${escapeHtml(getItinerarySkillNames(activity.skillIds))}</p>
                                        ${
                                          activity.resourceUrl
                                            ? `<a href="${escapeHtml(activity.resourceUrl)}" target="_blank" rel="noopener noreferrer">
                                                ${activity.type === "Course" ? "Check official catalog" : "Open resource"}
                                              </a>`
                                            : `<span class="activity-no-link">No resource link provided.</span>`
                                        }
                                      </div>
                                      <button
                                        class="button button-secondary"
                                        type="button"
                                        data-save-itinerary="${escapeHtml(activity.id)}"
                                        ${savedItineraryIds.has(activity.id) ? "disabled" : ""}
                                      >
                                        ${savedItineraryIds.has(activity.id) ? "Already saved" : "Save to itinerary"}
                                      </button>
                                    </li>`)
                                  .join("")}
                              </ul>`
                            : `<p class="mapped-empty">No recommendations are available for this skill yet.</p>`
                        }
                      </div>`
                    : ""
                }
              `
        }
      </section>

      <section class="itinerary-panel" aria-labelledby="itinerary-title">
        <h2 id="itinerary-title">Your itinerary · ${itineraryState.activities.length}</h2>
        <p class="itinerary-note">
          Saved in this browser's local demo only; these activities are not tied to a real account.
        </p>
        ${
          itineraryState.activities.length > 0
            ? `<ul class="itinerary-list">
                ${itineraryState.activities
                  .map((activity) => `
                    <li class="itinerary-item">
                      <div class="itinerary-item-copy">
                        <h3>${escapeHtml(activity.name)}</h3>
                        <p>${escapeHtml(activity.type)} · ${escapeHtml(getItinerarySkillNames(activity.skillIds))}</p>
                        ${
                          activity.resourceUrl
                            ? `<a href="${escapeHtml(activity.resourceUrl)}" target="_blank" rel="noopener noreferrer">
                                ${activity.type === "Course" ? "Check official catalog" : "Open resource"}
                              </a>`
                            : `<span class="activity-no-link">No resource link provided.</span>`
                        }
                      </div>
                      <button
                        class="text-button"
                        type="button"
                        data-remove-itinerary="${escapeHtml(activity.id)}"
                        aria-label="Remove ${escapeHtml(activity.name)} from itinerary"
                      >Remove</button>
                    </li>`)
                  .join("")}
              </ul>`
            : `<p class="mapped-empty">Save a course, project, or practice resource to reopen it here.</p>`
        }
        ${
          itineraryState.persistenceMessage
            ? `<p class="storage-message" role="status">${escapeHtml(itineraryState.persistenceMessage)}</p>`
            : ""
        }
      </section>

      <button class="button button-primary save-button" type="button">
        Check save status
      </button>

      <p class="disclaimer">
        Coursework suggests exposure, not verified mastery. Course availability and
        requirements must be checked in the official catalog.
      </p>
      ${[session.message, state.persistenceMessage, careerGoal.persistenceMessage, experienceState.persistenceMessage]
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

  const searchInput = root.querySelector<HTMLInputElement>("#course-search");
  searchInput?.addEventListener("input", () => {
    searchQuery = searchInput.value;
    draftCourseId = "";
    render("course-search");
  });

  root.querySelector<HTMLInputElement>("#transcript-file")?.addEventListener("change", (event) => {
    const input = event.currentTarget;
    if (input instanceof HTMLInputElement) {
      const file = input.files?.[0];
      input.value = "";
      if (file) {
        void reviewTranscript(file);
      }
    }
  });

  const transcriptDrop = root.querySelector<HTMLDivElement>("#transcript-drop");
  transcriptDrop?.addEventListener("dragover", (event) => event.preventDefault());
  transcriptDrop?.addEventListener("drop", (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      void reviewTranscript(file);
    }
  });

  root.querySelector<HTMLButtonElement>(".sample-transcript-button")?.addEventListener("click", async () => {
    try {
      const response = await fetch("/synthetic-transcript.pdf");
      if (!response.ok) {
        throw new Error("The sample transcript could not be loaded.");
      }
      const blob = await response.blob();
      await reviewTranscript(new File([blob], "synthetic-transcript.pdf", { type: "application/pdf" }));
    } catch (error) {
      transcriptMessage =
        error instanceof Error ? error.message : "The sample transcript could not be loaded.";
      render();
    }
  });

  root.querySelectorAll<HTMLInputElement>("[data-transcript-course]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const courseId = checkbox.dataset.transcriptCourse;
      if (!courseId) {
        return;
      }
      if (checkbox.checked) {
        selectedTranscriptCourseIds.add(courseId);
      } else {
        selectedTranscriptCourseIds.delete(courseId);
      }
      render();
    });
  });

  root.querySelector<HTMLButtonElement>(".confirm-transcript")?.addEventListener("click", () => {
    const added = courseSelectionStore.addCourses([...selectedTranscriptCourseIds]);
    transcriptMessage =
      added.length > 0
        ? `${added.length} course${added.length === 1 ? "" : "s"} added. Existing courses were not duplicated.`
        : "No new courses were added. Existing selections were not duplicated.";
    transcriptCandidates = [];
    selectedTranscriptCourseIds = new Set();
    announce(transcriptMessage);
    render();
  });

  root.querySelector<HTMLButtonElement>(".discard-transcript")?.addEventListener("click", () => {
    discardTranscriptReview();
  });

  root.querySelector<HTMLButtonElement>(".cancel-transcript")?.addEventListener("click", () => {
    discardTranscriptReview();
  });

  root.querySelector<HTMLButtonElement>(".manual-course-entry")?.addEventListener("click", () => {
    root.querySelector<HTMLInputElement>("#course-search")?.focus();
    root.querySelector<HTMLInputElement>("#course-search")?.scrollIntoView({ behavior: "smooth" });
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

  root.querySelector<HTMLSelectElement>("#learning-skill")?.addEventListener("change", (event) => {
    const select = event.currentTarget;
    if (select instanceof HTMLSelectElement) {
      selectedLearningSkillId = select.value;
      render("learning-skill");
    }
  });

  root.querySelectorAll<HTMLButtonElement>("[data-save-itinerary]").forEach((button) => {
    button.addEventListener("click", () => {
      const activityId = button.dataset.saveItinerary;
      if (!activityId) {
        return;
      }

      const result = itineraryStore.addActivity(activityId);
      if (!result.ok) {
        announce(
          result.reason === "duplicate"
            ? "This activity is already in your itinerary."
            : "This recommendation is no longer available. Refresh the page and try again.",
        );
        return;
      }

      const persistenceMessage = itineraryStore.getState().persistenceMessage;
      announce(
        result.persisted
          ? `Saved ${result.activity.name} to your itinerary.`
          : `Added ${result.activity.name} for this session only. ${persistenceMessage ?? "Browser storage is unavailable."}`,
      );
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-remove-itinerary]").forEach((button) => {
    button.addEventListener("click", () => {
      const activityId = button.dataset.removeItinerary;
      if (!activityId || !itineraryStore.removeActivity(activityId)) {
        announce("This itinerary activity is no longer available. Refresh the page.");
        return;
      }

      const persistenceMessage = itineraryStore.getState().persistenceMessage;
      announce(
        persistenceMessage
          ? `Removed the activity for this session. ${persistenceMessage}`
          : "Removed the activity from your itinerary.",
      );
    });
  });

  root.querySelector<HTMLInputElement>("#experience-title")?.addEventListener("input", (event) => {
    const input = event.currentTarget;
    if (input instanceof HTMLInputElement) {
      experienceTitleDraft = input.value;
    }
  });

  root.querySelector<HTMLSelectElement>("#experience-type")?.addEventListener("change", (event) => {
    const select = event.currentTarget;
    if (select instanceof HTMLSelectElement) {
      experienceTypeDraft = select.value;
    }
  });

  root.querySelectorAll<HTMLInputElement>("[data-experience-skill]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const skillId = checkbox.dataset.experienceSkill;
      if (!skillId) {
        return;
      }
      if (checkbox.checked) {
        experienceSkillDrafts.add(skillId);
      } else {
        experienceSkillDrafts.delete(skillId);
      }
    });
  });

  root.querySelector<HTMLFormElement>("#experience-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const draft = {
      title: experienceTitleDraft,
      type: experienceTypeDraft,
      skillIds: [...experienceSkillDrafts],
    };
    const result = editingExperienceId
      ? experienceStore.updateExperience(editingExperienceId, draft)
      : experienceStore.addExperience(draft);

    if (!result.ok) {
      experienceFormErrors = result.errors;
      render("experience-title");
      return;
    }

    const wasEditing = editingExperienceId !== null;
    experienceTitleDraft = "";
    experienceTypeDraft = "";
    experienceSkillDrafts = new Set();
    editingExperienceId = null;
    experienceFormErrors = null;
    announce(`${wasEditing ? "Updated" : "Added"} self-reported experience: ${result.record.title}.`);
    render();
  });

  root.querySelectorAll<HTMLButtonElement>("[data-edit-experience]").forEach((button) => {
    button.addEventListener("click", () => {
      const experienceId = button.dataset.editExperience;
      const experience = experienceState.experiences.find((item) => item.id === experienceId);
      if (!experience) {
        return;
      }
      editingExperienceId = experience.id;
      experienceTitleDraft = experience.title;
      experienceTypeDraft = experience.type;
      experienceSkillDrafts = new Set(experience.skillIds);
      experienceFormErrors = null;
      render("experience-title");
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-remove-experience]").forEach((button) => {
    button.addEventListener("click", () => {
      const experienceId = button.dataset.removeExperience;
      if (!experienceId || !experienceStore.removeExperience(experienceId)) {
        return;
      }
      if (editingExperienceId === experienceId) {
        editingExperienceId = null;
        experienceTitleDraft = "";
        experienceTypeDraft = "";
        experienceSkillDrafts = new Set();
      }
      experienceFormErrors = null;
      announce("Removed custom experience. Skills supported by other sources remain in the inventory.");
      render();
    });
  });

  root.querySelector<HTMLButtonElement>(".cancel-experience-edit")?.addEventListener("click", () => {
    editingExperienceId = null;
    experienceTitleDraft = "";
    experienceTypeDraft = "";
    experienceSkillDrafts = new Set();
    experienceFormErrors = null;
    render();
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
      announce(getSaveAnnouncementText(state, careerGoal, experienceState, itineraryState));
  });

  root.querySelector<HTMLButtonElement>(".sign-out-button")?.addEventListener("click", () => {
    demoSessionStore.signOut();
  });
}

courseSelectionStore.subscribe(() => render("course-search"));
careerGoalStore.subscribe(() => render());
demoSessionStore.subscribe(() => render());
experienceStore.subscribe(() => render());
itineraryStore.subscribe(() => render());
render();
