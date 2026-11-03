import { courses, skillsById } from "./data/catalog";
import { courseSelectionStore } from "./state/courseSelectionStore";
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

function render(focusTarget?: string): void {
  const state = courseSelectionStore.getState();
  const selectedIds = new Set(state.completedCourseIds);
  const availableCourses = courses.filter((course) => !selectedIds.has(course.id));
  const matchingCourses = availableCourses.filter((course) =>
    `${course.code} ${course.title}`.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const normalizedQuery = searchQuery.trim().toLowerCase();
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
    searchQuery && !draftCourse && matchingCourses.length > 0,
  );
  const draftSkills =
    draftCourse?.skillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill)) ?? [];
  const searchHelp =
    courses.length === 0
      ? "No supported courses are available in this demo yet."
      : availableCourses.length === 0
        ? "You have added every supported demo course."
        : searchQuery && matchingCourses.length === 0
          ? "No matching courses. Try another code or name."
          : searchQuery && !draftCourse
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
        <button
          class="entry-tab"
          type="button"
          disabled
          aria-label="Project or experience entry is not included in this demo"
        >
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

      <button class="button button-primary save-button" type="button">
        Save and continue →
      </button>

      <p class="disclaimer">
        Coursework suggests exposure, not verified mastery. Course availability and
        requirements must be checked in the official catalog.
      </p>
      ${
        state.persistenceMessage
          ? `<p class="storage-message" role="status">${escapeHtml(state.persistenceMessage)}</p>`
          : ""
      }
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
    announce(
      `${state.completedCourses.length} course${state.completedCourses.length === 1 ? "" : "s"} saved locally.`,
    );
  });
}

courseSelectionStore.subscribe(() => render("course-search"));
render();
