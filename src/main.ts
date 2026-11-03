import { courses, skillsById } from "./data/catalog";
import "./style.css";

const root = document.querySelector<HTMLDivElement>("#root");

if (!root) {
  throw new Error("Application root element was not found.");
}

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

    <section class="catalog" aria-labelledby="catalog-title">
      <div class="section-heading">
        <div>
          <h2 id="catalog-title">Demo course catalog</h2>
          <p>Example courses and suggested skills for the local demo.</p>
        </div>
        <span class="course-count">${courses.length} courses</span>
      </div>
      <ul class="course-list">
        ${courses
          .map((course) => {
            const mappedSkills = course.skillIds
              .map((skillId) => skillsById.get(skillId)?.name)
              .filter((name): name is string => Boolean(name));

            return `
              <li class="course-card">
                <div>
                  <p class="course-code">${course.code}</p>
                  <h3>${course.title}</h3>
                </div>
                <ul class="skill-list" aria-label="Suggested skills">
                  ${mappedSkills.map((name) => `<li>${name}</li>`).join("")}
                </ul>
              </li>
            `;
          })
          .join("")}
      </ul>
      <p class="disclaimer">
        Demo mappings are illustrative suggestions. Verify course availability and
        requirements with the official catalog.
      </p>
    </section>
  </main>
`;
