'use client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateClassLoadPDF = async (assignments, selectedCourse, selectedTerm) => {
  // Create new document
  const doc = new jsPDF();
  
  try {
    // Add Poppins font
    doc.setFont('Poppins');
    doc.setTextColor(0, 0, 0); // Set text color to black

    // Load and add header image
    const headerImg = await loadImage('/logo-header.png');
    // Calculate center position for the image
    const pageWidth = doc.internal.pageSize.width;
    const imgWidth = 50; // reduced from 100
    const imgHeight = 15; // reduced from 20
    const xPos = (pageWidth - imgWidth) / 2;
    doc.addImage(headerImg, 'PNG', xPos, 10, imgWidth, imgHeight);

    // Move title closer to header
    doc.setFontSize(16);
    doc.text('Class Load Report', 105, 35, { align: 'center' }); // Changed from 40 to 35
    
    // Adjust metadata positions accordingly
    doc.setFontSize(12);
    doc.text(`Course: ${selectedCourse.courseCode} - ${selectedCourse.courseTitle}`, 15, 45); // Changed from 50 to 45
    doc.text(`Academic Year: ${selectedTerm.sy}`, 15, 52); // Changed from School Year to Academic Year
    doc.text(`Term: Term ${selectedTerm.term}`, 15, 59); // Changed to use actual term number

    // Filter assignments for selected course
    const courseAssignments = assignments.filter(
      a => a.classId?.course?.courseCode === selectedCourse.courseCode
    );

    // Group assignments by year level
    const groupedByYear = courseAssignments.reduce((acc, curr) => {
      const yearLevel = curr.yearLevel;
      if (!acc[yearLevel]) acc[yearLevel] = [];
      acc[yearLevel].push(curr);
      return acc;
    }, {});

    let currentY = 70; // Changed from 75 to 70

    // Generate tables for each year level
    Object.entries(groupedByYear).forEach(([yearLevel, yearAssignments]) => {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text(`${yearLevel} Year`, 15, currentY);
      currentY += 10;

      const tableData = [];
      yearAssignments.forEach(assignment => {
        const termSubjects = assignment.subjects
          .filter(s => s.term === selectedTerm.term)
          .map(s => s.subject?.subjectCode)
          .join(', ');

        if (termSubjects) {
          tableData.push([
            assignment.classId?.sectionName || '',
            termSubjects
          ]);
        }
      });

      if (tableData.length > 0) {
        // Generate table
        const tableConfig = {
          startY: currentY,
          head: [['Section', 'Subjects']],
          body: tableData,
          theme: 'grid',
          styles: { 
            fontSize: 10,
            textColor: [0, 0, 0], // Black text in table
            font: 'Poppins'
          },
          headStyles: { 
            fillColor: [50, 62, 143],
            textColor: [255, 255, 255], // White text for headers
            font: 'Poppins'
          },
          margin: { left: 15, right: 15 },
        };

        // Draw the table
        autoTable(doc, tableConfig);
        
        // Update currentY position based on the table end
        if (doc.lastAutoTable) {
          currentY = doc.lastAutoTable.finalY + 20;
        } else {
          currentY += 10;
        }
      } else {
        doc.setFontSize(10);
        doc.text('No subjects assigned for this term', 15, currentY);
        currentY += 20;
      }
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Return the document instead of saving directly
    return doc;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

// Helper function to load image
const loadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
};
