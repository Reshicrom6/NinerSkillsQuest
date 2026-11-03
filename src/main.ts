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
let searchQuery = "";
let selectedCourseId = "";

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
  const activeElement = document.activeElement;
  const activeFocusTarget =
    focusTarget ??
    (activeElement instanceof HTMLElement ? activeElement.dataset.focusTarget : undefined);
  const selectionStart =
    activeElement instanceof HTMLInputElement ? activeElement.selectionStart : null;
  const selectionEnd =
    activeElement instanceof HTMLInputElement ? activeElement.selectionEnd : null;

  root.innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <a class="wordmark" href="/" aria-label="Niner Skills Quest home">
          <span class="wordmark-mark" aria-hidden="true">N</span>
          <span>Niner Skills Quest</span>
        </a>
        <span class="demo-badge"><span aria-hidden="true"></span> Local demo</span>
      </header>

      <section class="intro" aria-labelledby="page-title">
        <p class="eyebrow">YOUR EXPERIENCE, IN ONE PLACE</p>
        <h1 id="page-title">Build your skills profile</h1>
        <p class="intro-copy">
          Start with the courses you have completed. Suggested skills are a starting
          point—not a measure of mastery.
        </p>
      </section>

      <section class="workspace" aria-label="Completed courses and mapped skills">
        <section class="panel entry-panel" aria-labelledby="entry-title">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">COURSEWORK</p>
              <h2 id="entry-title">Add what you already know</h2>
              <p>Choose completed courses to see their suggested skills.</p>
            </div>
            <span class="course-count">${courses.length} supported</span>
          </div>

          <form id="course-form" class="course-form">
            <div class="field">
              <label for="course-search">Search by course code or name</label>
              <input
                id="course-search"
                data-focus-target="course-search"
                type="search"
                value="${escapeHtml(searchQuery)}"
                placeholder="Try ITCS 2214"
                autocomplete="off"
              />
            </div>
            <div class="field">
              <label for="course-select">Supported courses</label>
              <select id="course-select" aria-describedby="course-select-help">
                <option value="">Choose a course</option>
                ${matchingCourses
                  .map(
                    (course) =>
                      `<option value="${escapeHtml(course.id)}" ${
                        selectedCourseId === course.id ? "selected" : ""
                      }>${escapeHtml(course.code)} — ${escapeHtml(course.title)}</option>`,
                  )
                  .join("")}
              </select>
              <p id="course-select-help" class="field-help">
                ${courses.length === 0
                  ? "No supported courses are available in this demo yet."
                  : availableCourses.length === 0
                    ? "You have added every supported demo course."
                    : matchingCourses.length === 0
                      ? "No available courses match that search. Try another code or name."
                      : `${matchingCourses.length} available course${matchingCourses.length === 1 ? "" : "s"}.`}
              </p>
            </div>
            <button
              class="button button-secondary add-button"
              type="submit"
              ${selectedCourseId ? "" : "disabled"}
            >
              Add course
            </button>
          </form>

          <section class="selected-section" aria-labelledby="selected-title">
            <div class="section-heading">
              <h3 id="selected-title">Completed courses</h3>
              <span class="item-count">${state.completedCourses.length}</span>
            </div>
            ${state.completedCourses.length > 0
              ? `<ul class="selected-list">
                  ${state.completedCourses
                    .map((course) => {
                      const courseSkills = course.skillIds
                        .map((skillId) => skillsById.get(skillId)?.name)
                        .filter((name): name is string => Boolean(name));
                      return `
                        <li class="selected-course">
                          <div class="selected-course-copy">
                            <h4>${escapeHtml(course.code)} — ${escapeHtml(course.title)}</h4>
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
                        </li>
                      `;
                    })
                    .join("")}
                </ul>`
              : `<p class="empty-state">No courses selected yet. Search for a supported course above to get started.</p>`}
          </section>
        </section>

        <section class="panel skills-panel" aria-labelledby="skills-title">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">SUGGESTED FROM COURSEWORK</p>
              <h2 id="skills-title">Mapped skills</h2>
              <p>Skills are deduplicated across your selected courses.</p>
            </div>
            <span class="course-count">${state.skills.length} skills</span>
          </div>
          ${state.skills.length > 0
            ? `<ul class="mapped-skill-list">
                ${state.skills.map((skill) => `<li>${escapeHtml(skill.name)}</li>`).join("")}
              </ul>`
            : `<p class="empty-state">${
                state.completedCourses.length === 0
                  ? "Add a supported course to see its suggested skills here."
                  : "No mapped skills are available for the selected courses yet."
              }</p>`}
          <p class="disclaimer">
            Coursework suggests exposure, not verified mastery. Course availability
            and requirements should be checked in the official catalog.
          </p>
          ${
            state.persistenceMessage
              ? `<p class="storage-message" role="status">${escapeHtml(state.persistenceMessage)}</p>`
              : ""
          }
        </section>
      </section>
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

  const select = root.querySelector<HTMLSelectElement>("#course-select");
  select?.addEventListener("change", () => {
    selectedCourseId = select.value;
    const addButton = root.querySelector<HTMLButtonElement>(".add-button");
    if (addButton) {
      addButton.disabled = selectedCourseId === "";
    }
  });

  const searchInput = root.querySelector<HTMLInputElement>("#course-search");
  searchInput?.addEventListener("input", () => {
    searchQuery = searchInput.value;
    selectedCourseId = "";
    render("course-search");
  });

  root.querySelector<HTMLFormElement>("#course-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const courseId = root.querySelector<HTMLSelectElement>("#course-select")?.value;
    if (!courseId) {
      return;
    }

    searchQuery = "";
    selectedCourseId = "";
    courseSelectionStore.addCourse(courseId);
  });

  root.querySelectorAll<HTMLButtonElement>("[data-remove-course]").forEach((button) => {
    button.addEventListener("click", () => {
      const courseId = button.dataset.removeCourse;
      if (courseId) {
        courseSelectionStore.removeCourse(courseId);
      }
    });
  });
}

courseSelectionStore.subscribe(() => render("course-search"));
render();
