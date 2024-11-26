function createTooltip(course, event, currentTooltip) {
  console.log("Creating tooltip for course:", course); // Debugging log

  // Remove any existing tooltip
  if (currentTooltip) {
    console.log("Removing existing tooltip"); // Debugging log
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

  console.log("Tooltip created:", tooltip); // Debugging log

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
  const apiUrl = `https://content.osu.edu/v2/classes/search?q=${courseNumber}&campus=col&term=1252&p=1&subject=${courseDepartment}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.data.courses && data.data.courses.length > 0) {
      // Find the first course that matches the department and catalog number
      const matchingCourse = data.data.courses.find(
        (c) =>
          c.course.subject.toLowerCase() === courseDepartment &&
          c.course.catalogNumber === courseNumber
      ).course;

      if (matchingCourse) {
        const courseTitle = matchingCourse.title;
        const courseDescription =
          matchingCourse.description || "No description available.";

        tooltip.innerHTML = `
          <h4>${courseDepartment.toUpperCase()} ${courseNumber}: ${courseTitle}</h4>
          <p>${courseDescription}</p>
        `;
      } else {
        tooltip.innerHTML = `
          <strong>Course name:</strong> ${courseDepartment.toUpperCase()} ${courseNumber}<br>
          <strong>Credit hours:</strong> 3<br>
          <strong>Description:</strong> No courses found.
        `;
      }
    } else {
      tooltip.innerHTML = `
        <strong>Course name:</strong> ${courseDepartment.toUpperCase()} ${courseNumber}<br>
        <strong>Credit hours:</strong> 3<br>
        <strong>Description:</strong> No courses found.
      `;
    }
  } catch (error) {
    console.error("Error fetching course details:", error);
    tooltip.innerHTML = `
      <strong>Course name:</strong> ${courseDepartment.toUpperCase()} ${courseNumber}<br>
      <strong>Credit hours:</strong> 3<br>
      <strong>Description:</strong> Unable to fetch course details.
    `;
  }
}

function highlightCourses() {
  const courses = document.querySelectorAll(".course.draggable");

  console.log(`Found ${courses.length} courses.`); // Debugging log

  let currentTooltip = null;
  let tooltipCreatedByHover = false;

  courses.forEach((course) => {
    course.classList.add("cg-highlight-button");

    course.addEventListener("click", (event) => {
      console.log("Course clicked:", course); // Debugging log
      event.stopPropagation();
      currentTooltip = createTooltip(course, event, currentTooltip);
      tooltipCreatedByHover = false;
    });

    course.addEventListener("mouseover", (event) => {
      if (!currentTooltip) {
        console.log("Course hovered:", course); // Debugging log
        currentTooltip = createTooltip(course, event, currentTooltip);
        tooltipCreatedByHover = true;
      }
    });

    course.addEventListener("mouseout", () => {
      if (currentTooltip && tooltipCreatedByHover) {
        console.log("Course mouseout:", course); // Debugging log
        currentTooltip.remove();
        currentTooltip = null;
      }
    });
  });

  document.addEventListener("click", () => {
    if (currentTooltip) {
      console.log("Document clicked, removing tooltip"); // Debugging log
      currentTooltip.remove();
      currentTooltip = null;
    }
  });
}

highlightCourses();
