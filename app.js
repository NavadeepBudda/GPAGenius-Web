function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

  document.addEventListener('DOMContentLoaded', function() {
      const courseForm = document.getElementById('courseForm');
      const addCourseBtn = document.getElementById('addCourseBtn');
      const courseList = document.getElementById('courseList');
      const calculateGpaBtn = document.getElementById('calculateGpaBtn');
      const unweightedGPAEl = document.getElementById('unweightedGPA');
      const weightedGPAEl = document.getElementById('weightedGPA');
      const gradesDistributionEl = document.getElementById('gradesDistribution');
      const recommendationsContent = document.getElementById('recommendationsContent');
      const generatePdfBtn = document.getElementById('generatePdfBtn');

      let courses = [];

      addCourseBtn.addEventListener('click', function() {
          const courseName = document.getElementById('courseName').value;
          const grade = document.getElementById('grade').value.toUpperCase();
          const creditHours = parseFloat(document.getElementById('creditHours').value);
          const courseType = document.getElementById('courseType').value;

          if (!courseName || !grade.match(/[ABCDF]/) || isNaN(creditHours)) {
              alert('Please fill in all fields correctly.');
              return;
          }

          courses.push({ courseName, grade, creditHours, courseType });
          updateCourseList();

          // Clear form fields
          courseForm.reset();
      });

      calculateGpaBtn.addEventListener('click', function() {
          const targetGPA = parseFloat(document.getElementById('targetGPA').value);
          const futureCourses = parseInt(document.getElementById('futureCourses').value);
          const futureCredits = parseFloat(document.getElementById('futureCredits').value);

          if (isNaN(targetGPA) || isNaN(futureCourses) || isNaN(futureCredits)) {
              alert('Please fill in all GPA calculation fields correctly.');
              return;
          }

          const results = calculateGPA(courses, targetGPA, futureCourses, futureCredits);
          displayGPAResults(results);
          updateDynamicRecommendations(results.currentGPA, results.currentWeightedGPA);
      });

      generatePdfBtn.addEventListener('click', function() {
          generateTranscriptPDF();
      });

      function updateCourseList() {
          courseList.innerHTML = '';
          courses.forEach(course => {
              const li = document.createElement('li');
              li.textContent = `${course.courseName} - Grade: ${course.grade}, Credit Hours: ${course.creditHours}, Type: ${course.courseType}`;
              courseList.appendChild(li);
          });
      }

    function calculateGPA(courses, targetGPA, futureCourses, futureCredits) {
        let totalCredits = 0;
        let totalPoints = 0;
        let totalWeightedPoints = 0;

        courses.forEach(course => {
            const { grade, creditHours, courseType } = course;
            const gradePoint = getGradePoint(grade);
            const weightedGradePoint = getWeightedGradePoint(grade, courseType);
            totalCredits += creditHours;
            totalPoints += gradePoint * creditHours;
            totalWeightedPoints += weightedGradePoint * creditHours;
        });

        const currentUnweightedGPA = totalPoints / totalCredits;
        const currentWeightedGPA = totalWeightedPoints / totalCredits;
        const requiredTotalPointsForTarget = targetGPA * (totalCredits + futureCourses * futureCredits);
        const requiredFutureGPA = (requiredTotalPointsForTarget - totalPoints) / (futureCourses * futureCredits);

        return { currentUnweightedGPA, currentWeightedGPA, requiredFutureGPA };
    }

    function displayGPAResults({ currentUnweightedGPA, currentWeightedGPA, requiredFutureGPA }) {
        unweightedGPAEl.textContent = `Your current unweighted GPA is: ${currentUnweightedGPA.toFixed(2)}`;
        weightedGPAEl.textContent = `Your current weighted GPA is: ${currentWeightedGPA.toFixed(2)}`;

        let gradeNeededText = getGradeNeededText(requiredFutureGPA);
        gradesDistributionEl.textContent = `To reach your target GPA, you need ${gradeNeededText} in future courses.`;
    }

    function getGradeNeededText(averageRequiredFutureGrade) {
        if (averageRequiredFutureGrade >= 4.0) return 'mostly A\'s';
        else if (averageRequiredFutureGrade >= 3.0) return 'A\'s and B\'s';
        else if (averageRequiredFutureGrade >= 2.0) return 'B\'s and C\'s';
        else return 'C\'s or better'; // Adjust based on your grading system
    }

    function getWeightedGradePoint(grade, courseType) {
        const baseGradePoint = getGradePoint(grade);
        return courseType === 'AP' || courseType === 'Dual Enrollment' ? Math.min(5, baseGradePoint + 1) : baseGradePoint;
    }

      function updateDynamicRecommendations(currentGPA, currentWeightedGPA) {
          recommendationsContent.innerHTML = '';

          if (currentWeightedGPA >= 4.0) {
              recommendationsContent.textContent = 'Great job! Consider maintaining your GPA or exploring more challenging courses.';
          } else if (currentGPA < 3.0) {
              recommendationsContent.textContent = 'Focus on improving your foundational knowledge and consider tutoring if necessary.';
          } else {
              recommendationsContent.textContent = 'You are doing well, but there is room for improvement. Consider balancing course difficulty and seeking help where needed.';
          }
      }

    generatePdfBtn.addEventListener('click', function() {
        const doc = new jspdf.jsPDF();

        // Document title
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('Student Transcript', 105, 20, null, null, 'center');

        // Divider line
        doc.setDrawColor(0);
        doc.setLineWidth(1);
        doc.line(20, 30, 190, 30);

        // Skip rendering 'Name' and 'Student ID'

        // GPA Section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('GPA Summary', 20, 40);  // Adjusted Y position since Name and ID are removed

        // Unweighted GPA
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Unweighted GPA: ${unweightedGPAEl.textContent}`, 20, 47);  // Adjusted Y position

        // Weighted GPA
        doc.text(`Weighted GPA: ${weightedGPAEl.textContent}`, 20, 54);  // Adjusted Y position

        // Courses Section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Course Details', 20, 67);  // Adjusted Y position

        // Table Headers
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Course Name', 20, 74);  // Adjusted Y position
        doc.text('Grade', 100, 74);
        doc.text('Credit Hours', 140, 74);
        doc.text('Type', 180, 74);

        // Divider line below headers
        doc.line(20, 77, 190, 77);  // Adjusted Y position

        // Resetting font for course details
        doc.setFont(undefined, 'normal');

        let yPos = 84;  // Adjusted starting Y position for course details
        courses.forEach((course, index) => {
            const { courseName, grade, creditHours, courseType } = course;

            // Ensure not to overflow the page
            if (yPos > 270) {
                doc.addPage();
                yPos = 20; // Reset yPos for new page
            }

            doc.text(courseName, 20, yPos);
            doc.text(grade, 100, yPos);
            doc.text(creditHours.toString(), 140, yPos);
            doc.text(courseType, 180, yPos);
            yPos += 7;
        });

        // Footer
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        const pageCount = doc.internal.getNumberOfPages(); // Total number of pages
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, 105, 287, null, null, 'center'); // Footer content
        }

        doc.save('Transcript.pdf');
    });

      // Default open tab
      document.querySelector('.tablinks').click();
  });
