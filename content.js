//Cache to avoid repeated API calls
const apiCache = {};

function createTooltip(course, event, currentTooltip) {
  // Remove the existing tooltip
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
  }

  // Create a new tooltip
  const tooltip = document.createElement("div");
  tooltip.classList.add("cg-tooltip");

  // Set to loading while the api is queried content
  tooltip.innerHTML = `
    Loading...
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
  let courseNumber, courseDepartment;

  if (course.hasAttribute("number")) {
    // Parse the large lists of classes
    courseNumber = course.getAttribute("number").trim();
    courseDepartment = course.getAttribute("department").trim().toLowerCase();
  } else {
    // Parse the HTML to get individual course information
    const courseInfo = course.textContent.trim().split(/\s+/);
    courseDepartment = courseInfo[0].toLowerCase();
    courseNumber = courseInfo[1];
  }

  // Retrieve selectedCampus from chrome.storage.sync
  chrome.storage.sync.get({ campus: "col" }, (items) => {
    const selectedCampus = items.campus;
    const apiUrl = `https://content.osu.edu/v2/classes/search?q=${courseNumber}&campus=${selectedCampus}&p=1&subject=${courseDepartment}`;

    // Check if the response is cached
    if (apiCache[apiUrl]) {
      updateTooltip(
        course,
        apiCache[apiUrl],
        tooltip,
        courseDepartment,
        courseNumber
      );
      return;
    }

    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        // Cache the response
        apiCache[apiUrl] = data;
        updateTooltip(course, data, tooltip, courseDepartment, courseNumber);
      })
      .catch((error) => {
        console.error("Error fetching course details:", error);
        tooltip.innerHTML = `
          <strong>Course name:</strong> ${courseDepartment.toUpperCase()} ${courseNumber}<br>
          <strong>Description:</strong> Unable to fetch course details.
          <p>${error}</p>
        `;
      });
  });
}

function updateTooltip(course, data, tooltip, courseDepartment, courseNumber) {
  if (data.data.courses && data.data.courses.length > 0) {
    // Find all courses that match the department and catalog number
    const matchingCourses = data.data.courses.filter(
      (c) =>
        c.course.subject.toLowerCase() === courseDepartment &&
        (c.course.catalogNumber === courseNumber ||
          c.course.catalogNumber === `${courseNumber}H`) // Handle honors courses
    );

    // If there are matching courses, assume they are identical besides the term offered.
    // Get the term from each one and display them alongside the course details of the first one.
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

      // Display tooltip
      tooltip.innerHTML = `
        <p><strong>${courseDepartment.toUpperCase()} ${courseNumber}: ${courseTitle}</strong></p>
        <div class="cg-course-info">
          <p class="cg-no-vmargin"><strong>Credit hours:</strong> ${courseCreditHours}</p>
          <span class="cg-course-semesters"><strong>${courseSemesters}</strong></span>
        </div>
        <p>${courseDescription}</p>
        <div class="cg-buttons">
          <button class="cg-button cg-button-clear"/>
          <button class="cg-button cg-button-red"/>
          <button class="cg-button cg-button-yellow"/>
          <button class="cg-button cg-button-green"/>
        </div>
      `;

      // Remove the error styling if a course is found (only happens if you switch campuses)
      course.classList.remove("cg-highlight-error");

      // Callbacks for buttons
      tooltip
        .querySelector(".cg-button-clear")
        .addEventListener("click", () => {
          course.classList.remove(
            "cg-highlight-red",
            "cg-highlight-yellow",
            "cg-highlight-green"
          );
        });
      tooltip.querySelector(".cg-button-red").addEventListener("click", () => {
        course.classList.add("cg-highlight-red");
        course.classList.remove("cg-highlight-yellow", "cg-highlight-green");
      });
      tooltip
        .querySelector(".cg-button-yellow")
        .addEventListener("click", () => {
          course.classList.remove("cg-highlight-red", "cg-highlight-green");
          course.classList.add("cg-highlight-yellow");
        });
      tooltip
        .querySelector(".cg-button-green")
        .addEventListener("click", () => {
          course.classList.remove("cg-highlight-red", "cg-highlight-yellow");
          course.classList.add("cg-highlight-green");
        });

      // Courses were found in the search but do not match
    } else {
      tooltip.innerHTML = `
        <strong>No offerings</strong>
      `;
      course.classList.add("cg-highlight-error");
    }
    // No courses were found in the search
  } else {
    tooltip.innerHTML = `
      <strong>No offerings</strong>
    `;
    course.classList.add("cg-highlight-error");
  }
}

function highlightCourses() {
  const courses = document.querySelectorAll(".course");

  let currentTooltip = null;
  // Keep track of whether the tooltip was created by a hovering so it can be removed when the mouse leaves
  let tooltipCreatedByHover = false;

  courses.forEach((course) => {
    // Add class to enable course coloring on hover
    course.classList.add("cg-highlight-button");

    // Course interaction callbacks
    course.addEventListener("click", (event) => {
      event.stopPropagation();
      currentTooltip = createTooltip(course, event, currentTooltip);
      tooltipCreatedByHover = false;
    });

    course.addEventListener("mouseover", (event) => {
      setTimeout(() => {
        if (!currentTooltip && course.matches(":hover")) {
          currentTooltip = createTooltip(course, event, currentTooltip);
          tooltipCreatedByHover = true;
        }
      }, 100); // Delay tooltip to prevent spamming the API
    });

    course.addEventListener("mouseout", () => {
      if (currentTooltip && tooltipCreatedByHover) {
        currentTooltip.remove();
        currentTooltip = null;
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (currentTooltip && !currentTooltip.contains(event.target)) {
      currentTooltip.remove();
      currentTooltip = null;
    }
  });
}

// Attach callbacks to all courses on the page on page load
highlightCourses();
