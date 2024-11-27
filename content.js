const apiCache = {};

function createTooltip(course, event, currentTooltip) {
  // Remove any existing tooltip
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
  }

  // Create a new tooltip
  const tooltip = document.createElement("div");
  tooltip.classList.add("cg-tooltip");

  // Placeholder content
  tooltip.innerHTML = `
    <h2> Loading... </h2>
  `;

  // Position the tooltip
  tooltip.style.left = `${event.pageX + 10}px`;
  tooltip.style.top = `${event.pageY + 10}px`;

  // Add the tooltip to the document
  document.body.appendChild(tooltip);
  currentTooltip = tooltip;

  // Fetch course details from the API asynchronously
  fetchCourseDetails(course, tooltip);

  return currentTooltip;
}

async function fetchCourseDetails(course, tooltip) {
  const courseNumber = course.getAttribute("number").trim();
  const courseDepartment = course
    .getAttribute("department")
    .trim()
    .toLowerCase();
  const apiUrl = `https://content.osu.edu/v2/classes/search?q=${courseNumber}&campus=col&p=1&subject=${courseDepartment}`;

  // Check if the response is cached
  if (apiCache[apiUrl]) {
    console.log("Using cached data for:", apiUrl);
    updateTooltip(apiCache[apiUrl], tooltip, courseDepartment, courseNumber);
    return;
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Cache the response
    apiCache[apiUrl] = data;

    updateTooltip(data, tooltip, courseDepartment, courseNumber);
  } catch (error) {
    console.error("Error fetching course details:", error);
    tooltip.innerHTML = `
      <strong>Course name:</strong> ${courseDepartment.toUpperCase()} ${courseNumber}<br>
      <strong>Description:</strong> Unable to fetch course details.
      <p>${error}</p>
    `;
  }
}

function updateTooltip(data, tooltip, courseDepartment, courseNumber) {
  if (data.data.courses && data.data.courses.length > 0) {
    // Find all courses that match the department and catalog number
    const matchingCourses = data.data.courses.filter(
      (c) =>
        c.course.subject.toLowerCase() === courseDepartment &&
        c.course.catalogNumber === courseNumber
    );

    if (matchingCourses.length > 0) {
      const matchingCourse = matchingCourses[0].course;
      const courseTitle = matchingCourse.title;
      const courseDescription =
        matchingCourse.description || "No description available.";
      const courseCreditHours =
        matchingCourse.minUnits === matchingCourse.maxUnits
          ? `${matchingCourse.minUnits.toFixed(1)}`
          : `${matchingCourse.minUnits.toFixed(1)} – ${matchingCourse.maxUnits.toFixed(1)}`;
      const courseSemesters = matchingCourses
        .map((c) => c.course.term)
        .filter((term, i, self) => i === self.indexOf(term))
        .map((term) => term.slice(0, 2) + term.slice(-2))
        .join(", ");

      tooltip.innerHTML = `
        <p><strong>${courseDepartment.toUpperCase()} ${courseNumber}: ${courseTitle}</strong></p>
        <div class="cg-course-info">
          <p class="cg-no-vmargin"><strong>Credit hours:</strong> ${courseCreditHours}</p>
          <span class="cg-course-semesters"><strong>${courseSemesters}</strong></span>
        </div>
        <p>${courseDescription}</p>
      `;
    } else {
      tooltip.innerHTML = `
        <strong>No offerings</strong>
      `;
    }
  } else {
    tooltip.innerHTML = `
      <strong>No offerings</strong>
    `;
  }
}

function highlightCourses() {
  const courses = document.querySelectorAll(".course.draggable");

  let currentTooltip = null;
  let tooltipCreatedByHover = false;

  courses.forEach((course) => {
    course.classList.add("cg-highlight-button");

    course.addEventListener("click", (event) => {
      event.stopPropagation();
      currentTooltip = createTooltip(course, event, currentTooltip);
      tooltipCreatedByHover = false;
    });

    course.addEventListener("mouseover", (event) => {
      if (!currentTooltip) {
        currentTooltip = createTooltip(course, event, currentTooltip);
        tooltipCreatedByHover = true;
      }
    });

    course.addEventListener("mouseout", () => {
      if (currentTooltip && tooltipCreatedByHover) {
        currentTooltip.remove();
        currentTooltip = null;
      }
    });
  });

  document.addEventListener("click", () => {
    if (currentTooltip) {
      currentTooltip.remove();
      currentTooltip = null;
    }
  });
}

highlightCourses();
