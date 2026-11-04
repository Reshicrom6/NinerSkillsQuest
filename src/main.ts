import { courses, skillsById } from "./data/catalog";
import { courseSelectionStore } from "./state/courseSelectionStore";
import "./style.css";
import "../styles.css";

interface Gap {
  id: string;
  label: string;
  score: string;
  track: string;
  summary: string;
  actions: string[];
}

const gaps: Gap[] = [
  {
    id: "system-design",
    label: "System Design & Microservices",
    score: "72%",
    track: "Architecture patterns",
    summary:
      "Great foundation in service decomposition and API contracts, but practice designing distributed systems and durable trade-offs.",
    actions: [
      "Review a microservice API design walkthrough",
      "Map a three-service system with failure modes",
      "Compare synchronous vs asynchronous integrations",
    ],
  },
  {
    id: "aws-cloud",
    label: "AWS Cloud Services",
    score: "61%",
    track: "Cloud deployment",
    summary:
      "You understand core backend patterns, but you need more hands-on experience with IAM, networking, and containerized hosting.",
    actions: [
      "Deploy a Node API to EC2 or ECS",
      "Set up RDS + S3 with role-based access control",
      "Design a cloud logging and observability flow",
    ],
  },
  {
    id: "spring-boot",
    label: "Spring Boot",
    score: "78%",
    track: "Java backend",
    summary:
      "You are close to benchmark readiness here. Prioritize persistence, security, and production-ready service patterns.",
    actions: [
      "Build a CRUD module with JWT auth",
      "Connect persistence with validation and exception handling",
      "Measure performance with profiling and caching",
    ],
  },
];

const STORAGE_KEY = "niner-skills-task-state";
const RESOLVED_GAPS_KEY = "niner-skills-resolved-gaps";
const baseMatchScore = 46;
const resolvedGaps = new Set<string>(loadResolvedGapState());
const taskStateByGap: Record<string, boolean[]> = {
  "system-design": [false, false, false],
  "aws-cloud": [false, false, false],
  "spring-boot": [false, false, false],
};

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

function announce(message: string): void {
  if (announcer) {
    announcer.textContent = message;
  }
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

function getHashRoute(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "course";
}

function setHashRoute(hash: string): void {
  const safeHash = hash.startsWith("#") ? hash : `#${hash}`;
  window.location.hash = safeHash;
}

function loadResolvedGapState(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(RESOLVED_GAPS_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function saveResolvedGapState(): void {
  try {
    localStorage.setItem(RESOLVED_GAPS_KEY, JSON.stringify([...resolvedGaps]));
  } catch {
    // Ignore persistence failures for this client-side demo.
  }
}

function loadTaskState(): void {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    for (const gapId of Object.keys(taskStateByGap)) {
      const savedState = saved[gapId];
      if (Array.isArray(savedState)) {
        taskStateByGap[gapId] = savedState.slice(0, taskStateByGap[gapId].length).map(Boolean);
      } else {
        taskStateByGap[gapId] = [...taskStateByGap[gapId]];
      }
    }
  } catch {
    // Ignore invalid task state and fall back to the defaults.
  }
}

function saveTaskState(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(taskStateByGap));
  } catch {
    // Ignore persistence failures for this client-side demo.
  }
}

function getTaskState(gapId: string): boolean[] {
  if (!taskStateByGap[gapId]) {
    taskStateByGap[gapId] = [false, false, false];
  }
  return taskStateByGap[gapId];
}

function getOverallMatchScore(): number {
  return Math.min(100, baseMatchScore + resolvedGaps.size * 18);
}

function getNextGap(currentGapId: string): Gap | null {
  const currentIndex = gaps.findIndex((gap) => gap.id === currentGapId);
  if (currentIndex === -1) {
    return null;
  }

  const remaining = gaps.slice(currentIndex + 1).find((gap) => !resolvedGaps.has(gap.id));
  if (remaining) {
    return remaining;
  }

  return gaps.find((gap) => !resolvedGaps.has(gap.id) && gap.id !== currentGapId) ?? null;
}

function renderCourseSelectionPage(focusTarget?: string): void {
  const state = courseSelectionStore.getState();
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
  const hasSearchResults = Boolean(normalizedQuery && !draftCourse && matchingCourses.length > 0);
  const draftSkills =
    draftCourse?.skillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill)) ?? [];

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
          <p>Build your Backend Developer starting point.</p>
        </div>
        <span class="demo-badge">Local demo</span>
      </header>

      <nav class="entry-tabs" aria-label="Experience type">
        <button class="entry-tab is-active" type="button" aria-current="page">Course</button>
        <button class="entry-tab" type="button" disabled aria-label="Project or experience entry is not included in this demo">
          Project or experience
        </button>
      </nav>

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
          ${searchHelp ? `<p id="course-search-help" class="field-help">${escapeHtml(searchHelp)}</p>` : ""}
          ${
            hasSearchResults
              ? `<ul id="course-search-results" class="search-results" aria-label="Matching supported courses">
                  ${matchingCourses
                    .map(
                      (course) => `
                        <li>
                          <button class="search-result" type="button" data-select-course="${escapeHtml(course.id)}">
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
                  <span class="status-tag is-unavailable" aria-label="In progress status is outside this completed-course demo" title="This feature only tracks completed courses.">
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

        <button class="button button-secondary add-button" type="submit" ${draftCourse ? "" : "disabled"}>
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
                          <p>Completed${courseSkills.length > 0 ? ` · ${courseSkills.map(escapeHtml).join(", ")}` : ""}</p>
                        </div>
                        <button class="text-button remove-button" type="button" data-remove-course="${escapeHtml(course.id)}" aria-label="Remove ${escapeHtml(course.code)} — ${escapeHtml(course.title)}">
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

      <button class="button button-primary save-button" type="button">
        Save and continue →
      </button>

      <p class="disclaimer">
        Coursework suggests exposure, not verified mastery. Course availability and requirements must be checked in the official catalog.
      </p>
      ${state.persistenceMessage ? `<p class="storage-message" role="status">${escapeHtml(state.persistenceMessage)}</p>` : ""}
    </main>
  `;

  if (activeFocusTarget) {
    const nextFocus = root.querySelector<HTMLElement>(`[data-focus-target="${activeFocusTarget}"]`);
    nextFocus?.focus();
    if (nextFocus instanceof HTMLInputElement && selectionStart !== null && selectionEnd !== null) {
      nextFocus.setSelectionRange(selectionStart, selectionEnd);
    }
  }

  const searchInput = root.querySelector<HTMLInputElement>("#course-search");
  searchInput?.addEventListener("input", () => {
    searchQuery = searchInput.value;
    draftCourseId = "";
    renderCourseSelectionPage("course-search");
  });

  root.querySelectorAll<HTMLButtonElement>("[data-select-course]").forEach((button) => {
    button.addEventListener("click", () => {
      const courseId = button.dataset.selectCourse;
      if (courseId) {
        draftCourseId = courseId;
        renderCourseSelectionPage("course-search");
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
    const state = courseSelectionStore.getState();
    const saveMessage =
      state.persistenceMessage ??
      `${state.completedCourses.length} course${state.completedCourses.length === 1 ? "" : "s"} saved locally.`;

    announce(saveMessage);
    setHashRoute("dashboard");
    renderApp();
  });
}

function renderDashboard(): void {
  const overallMatchScore = getOverallMatchScore();
  const progressPercent = Math.min(100, overallMatchScore);
  const ringStyle = `background: conic-gradient(var(--accent) 0 ${progressPercent}%, #e5e9ee ${progressPercent}% 100%);`;

  root.innerHTML = `
    <div class="app-shell dashboard-shell">
      <header class="topbar">
        <div class="topbar__left">
          <span class="avatar">A</span>
          <a href="#dashboard" class="nav-link is-active">Dashboard</a>
          <a href="#dashboard" class="nav-link">Quest Log</a>
          <a href="#dashboard" class="nav-link">Profile</a>
        </div>
        <div class="topbar__right">
          <a href="#dashboard" class="nav-link">Settings</a>
          <a href="#dashboard" class="nav-link">Upload Transcript</a>
          <span class="avatar">A</span>
        </div>
      </header>

      <main class="dashboard">
        <div class="page-header">
          <h1 class="section-title">Readiness Dashboard</h1>
          <p class="kicker">Bank of America • Backend Developer</p>
        </div>

        <section class="summary-card">
          <div class="score-ring" aria-label="${overallMatchScore} percent overall match score" style="${ringStyle}">
            <div class="score-ring__content">
              <div class="score-ring__value">${overallMatchScore}%</div>
              <div class="score-ring__caption">Overall match score</div>
            </div>
          </div>

          <div class="role-summary__meta">
            <h2 class="role-summary__heading">Backend Developer readiness</h2>
            <p class="role-summary__body">
              Sample comparison for Bank of America. Review strengths and select a skill gap to plan your next activity.
            </p>
          </div>
        </section>

        <div class="section-grid">
          <section class="card strengths-card">
            <h3>Strengths — acquired</h3>
            <div class="skill-stack strengths-stack">
              <div class="strength-row"><span>OOP / Java</span><span class="mini-bar"><i style="width: 92%"></i></span></div>
              <div class="strength-row"><span>SQL / Databases</span><span class="mini-bar"><i style="width: 88%"></i></span></div>
              <div class="strength-row"><span>Git / Versioning</span><span class="mini-bar"><i style="width: 94%"></i></span></div>
            </div>
          </section>

          <section class="card gaps-card">
            <h3>Critical gaps</h3>
            <div class="gap-list">
              ${gaps
                .map((gap) => {
                  const isResolved = resolvedGaps.has(gap.id);
                  return `
                    <button class="gap-button ${isResolved ? "gap-button--resolved" : ""}" type="button" data-gap="${gap.id}" ${isResolved ? "disabled" : ""}>
                      <span class="gap-button__label">[${isResolved ? "✓" : "!"}] ${gap.label}</span>
                    </button>
                  `;
                })
                .join("")}
            </div>
          </section>
        </div>

        <section class="pathway-panel">
          <h3>UNCC course pathway engine</h3>
          <div class="pathway-row">
            <span class="course-pill">Java / ITCS 2214</span>
            <span class="path-arrow">→</span>
            <span class="course-pill course-pill--highlight">ITIS 4166 (Spring Boot)</span>
            <span class="path-arrow">→</span>
            <span class="course-status">Ready!</span>
          </div>
        </section>

        <div class="action-bar">Copy skills to clipboard</div>

        <div class="cta-row">
          <button class="primary-action primary-action--dark" type="button">View my career plan</button>
          <button class="primary-action primary-action--dark" type="button">Change career / employer</button>
        </div>
      </main>
    </div>
  `;

  root.querySelectorAll<HTMLButtonElement>("[data-gap]").forEach((button) => {
    if (button.disabled) {
      return;
    }

    button.addEventListener("click", () => {
      const gapId = button.dataset.gap;
      if (!gapId) {
        return;
      }

      setHashRoute(`gap-${gapId}`);
      renderApp();
    });
  });
}

function updateCompleteButtonState(): void {
  const completeButton = root.querySelector<HTMLButtonElement>(".complete-cta");
  if (!completeButton) {
    return;
  }

  const taskCheckboxes = root.querySelectorAll<HTMLInputElement>(".task-checkbox");
  const allChecked = taskCheckboxes.length > 0 && Array.from(taskCheckboxes).every((checkbox) => checkbox.checked);

  completeButton.disabled = false;
  completeButton.classList.toggle("complete-cta--disabled", false);
  completeButton.setAttribute("aria-disabled", String(false));

  if (!allChecked) {
    completeButton.setAttribute("aria-disabled", String(false));
  }
}

function renderGapDetail(gapId: string): void {
  const gap = gaps.find((item) => item.id === gapId) ?? gaps[0];
  const nextGap = getNextGap(gap.id);
  const taskState = getTaskState(gap.id);

  root.innerHTML = `
    <div class="app-shell detail-shell">
      <div class="annotation-ribbon">Sample application deadline · finish your priority quest this week</div>

      <header class="detail-header">
        <div>
          <h1 class="detail-title">${gap.label}</h1>
          <p class="detail-subtitle">Critical gap · ${gap.track}</p>
        </div>
      </header>

      <nav class="detail-nav">
        <a href="#dashboard" class="nav-link">Profile</a>
        <a href="#dashboard" class="nav-link">Dashboard</a>
        <a href="#dashboard" class="nav-link">Quest Log</a>
        <a href="#dashboard" class="nav-link">Settings</a>
        <a href="#dashboard" class="nav-link">Upload Transcript</a>
        <span class="nav-user">Alex •</span>
      </nav>

      <main class="quest-page">
        <div class="quest-progress-wrap">
          <div class="quest-progress-label">XP: 2,340 • Complete this quest to earn 80 XP</div>
          <div class="quest-progress-bar">
            <div class="quest-progress-fill" style="width: 56%;"></div>
          </div>
        </div>

        <section class="task-panel">
          <div class="panel-title">Recommended focus tasks</div>
          <div class="task-row">
            <input class="task-checkbox" data-task-index="0" type="checkbox" ${taskState[0] ? "checked" : ""} aria-label="Complete task: Review ${gap.label.toLowerCase()} fundamentals" />
            <span class="task-text">Review ${gap.label.toLowerCase()} fundamentals</span>
            <span class="task-xp">+20 XP</span>
          </div>
          <div class="task-row">
            <input class="task-checkbox" data-task-index="1" type="checkbox" ${taskState[1] ? "checked" : ""} aria-label="Complete task: Build a small practice project related to ${gap.track.toLowerCase()}" />
            <span class="task-text">Build a small practice project related to ${gap.track.toLowerCase()}</span>
            <span class="task-xp">+30 XP</span>
          </div>
          <div class="task-row">
            <input class="task-checkbox" data-task-index="2" type="checkbox" ${taskState[2] ? "checked" : ""} aria-label="Complete task: Document the trade-offs and design decisions you used" />
            <span class="task-text">Document the trade-offs and design decisions you used</span>
            <span class="task-xp">+30 XP</span>
          </div>
        </section>

        <section class="reward-panel">
          <div class="panel-title">Unlocked quest rewards</div>
          <div class="reward-grid">
            <div class="reward-card">Badge: API Adept</div>
            <div class="reward-card">+5% Readiness boost</div>
            <div class="reward-card">Next quest: ${nextGap ? nextGap.label : "All gaps complete"}</div>
          </div>
        </section>

        <button class="complete-cta" type="button">Complete quest &amp; update resume</button>

        <section class="insight-panel">
          <div class="insight-row">
            <span class="insight-bullet">•</span>
            <span>${gap.summary}</span>
          </div>
        </section>
      </main>
    </div>
  `;

  root.querySelectorAll<HTMLInputElement>(".task-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const taskIndex = Number(checkbox.dataset.taskIndex ?? 0);
      const taskState = getTaskState(gap.id);
      taskState[taskIndex] = checkbox.checked;
      saveTaskState();
      updateCompleteButtonState();
    });
  });

  const completeButton = root.querySelector<HTMLButtonElement>(".complete-cta");
  completeButton?.addEventListener("click", () => {
    const stripPrefix = window.location.hash.replace(/^#gap-/, "");
    if (stripPrefix) {
      const allChecked = Array.from(root.querySelectorAll<HTMLInputElement>(".task-checkbox")).every((checkbox) => checkbox.checked);
      if (allChecked) {
        resolvedGaps.add(stripPrefix);
        saveResolvedGapState();
      }
    }

    setHashRoute("dashboard");
    renderApp();
  });

  updateCompleteButtonState();
}

function renderApp(): void {
  const route = getHashRoute();

  if (route.startsWith("gap-")) {
    renderGapDetail(route.replace(/^gap-/, ""));
    return;
  }

  if (route === "dashboard") {
    renderDashboard();
    return;
  }

  renderCourseSelectionPage();
}

courseSelectionStore.subscribe(() => {
  if (getHashRoute() === "course") {
    renderCourseSelectionPage("course-search");
  }
});

window.addEventListener("hashchange", renderApp);
loadTaskState();
renderApp();
