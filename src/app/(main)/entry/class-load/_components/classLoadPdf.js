"use client"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export const generateClassLoadPDF = async (assignments, selectedCourse, selectedTerm) => {
  // Create new document
  const doc = new jsPDF()

  try {
    // Set default font
    doc.setFont("Helvetica")

    // Define colors
    const primaryColor = [50, 62, 143] // #323E8F
    const secondaryColor = [65, 80, 181] // #4150B5
    const lightBlue = [238, 242, 255] // #EEF2FF
    const darkGray = [51, 51, 51] // #333333
    const mediumGray = [102, 102, 102] // #666666

    // Load and add header image
    const headerImg = await loadImage("/logo-header.png")
    // Calculate center position for the image
    const pageWidth = doc.internal.pageSize.width
    const imgWidth = 50
    const imgHeight = 15
    const xPos = (pageWidth - imgWidth) / 2

    // Add a header background
    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, pageWidth, 25, "F")

    // Add logo
    doc.addImage(headerImg, "PNG", xPos, 5, imgWidth, imgHeight)

    // Add title section with background
    doc.setFillColor(...secondaryColor)
    doc.rect(0, 25, pageWidth, 15, "F")

    doc.setTextColor(255, 255, 255) // White
    doc.setFontSize(16)
    doc.setFont("Helvetica", "bold")
    doc.text("CLASS LOAD REPORT", 105, 35, { align: "center" })

    // Add metadata section with light background
    doc.setFillColor(...lightBlue)
    doc.rect(0, 40, pageWidth, 25, "F")

    // Add metadata content
    doc.setTextColor(...darkGray)
    doc.setFontSize(11)
    doc.setFont("Helvetica", "bold")
    doc.text("Course:", 15, 48)
    doc.text("Academic Year:", 15, 55)
    doc.text("Term:", 15, 62)

    doc.setFont("Helvetica", "normal")
    doc.text(`${selectedCourse.courseCode} - ${selectedCourse.courseTitle}`, 40, 48)
    doc.text(`${selectedTerm.sy}`, 55, 55)
    doc.text(`Term ${selectedTerm.term}`, 35, 62)

    // Filter assignments for selected course
    const courseAssignments = assignments.filter((a) => a.classId?.course?.courseCode === selectedCourse.courseCode)

    // Group assignments by year level
    const groupedByYear = courseAssignments.reduce((acc, curr) => {
      const yearLevel = curr.yearLevel
      if (!acc[yearLevel]) acc[yearLevel] = []
      acc[yearLevel].push(curr)
      return acc
    }, {})

    let currentY = 75

    // Generate tables for each year level
    Object.entries(groupedByYear).forEach(([yearLevel, yearAssignments]) => {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage()
        currentY = 20
      }

      // Year level header with background
      doc.setFillColor(...primaryColor)
      doc.rect(15, currentY - 5, 180, 10, "F")

      doc.setTextColor(255, 255, 255) // White
      doc.setFontSize(12)
      doc.setFont("Helvetica", "bold")
      doc.text(`${yearLevel} Year`, 105, currentY, { align: "center" })
      currentY += 10

      // Process data for the table with one subject per row
      let hasSubjects = false
      const tableData = []

      yearAssignments.forEach((assignment) => {
        // Get subjects for the selected term
        const termSubjects = assignment.subjects.filter((s) => s.term === selectedTerm.term)

        if (termSubjects.length > 0) {
          hasSubjects = true

          // Add each subject as a separate row, with merged section cell
          termSubjects.forEach((subject, index) => {
            const row = []

            // Only add section name in the first row for this section
            if (index === 0) {
              row.push({
                content: assignment.classId?.sectionName || "",
                rowSpan: termSubjects.length, // Merge cells vertically
              })
            }

            // Add subject code
            row.push(subject.subject?.subjectCode || "")

            // Add hours
            row.push(subject.hours || "N/A")

            tableData.push(row)
          })
        }
      })

      if (hasSubjects) {
        // Generate table with modern styling
        const tableConfig = {
          startY: currentY,
          head: [["Section", "Subject", "Hours"]],
          body: tableData,
          theme: "grid",
          styles: {
            fontSize: 10,
            textColor: [...darkGray],
            font: "Helvetica",
            cellPadding: 5,
          },
          headStyles: {
            fillColor: [...primaryColor],
            textColor: [255, 255, 255],
            font: "Helvetica",
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: {
            0: { fontStyle: "bold", halign: "left", cellWidth: 40 },
            1: { halign: "left" },
            2: { halign: "center", cellWidth: 30 },
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251], // Light gray for alternate rows
          },
          margin: { left: 15, right: 15 },
        }

        // Draw the table
        autoTable(doc, tableConfig)

        // Update currentY position based on the table end
        if (doc.lastAutoTable) {
          currentY = doc.lastAutoTable.finalY + 20
        } else {
          currentY += 10
        }
      } else {
        doc.setTextColor(...mediumGray)
        doc.setFontSize(10)
        doc.setFont("Helvetica", "italic")
        doc.text("No subjects assigned for this term", 105, currentY, { align: "center" })
        currentY += 20
      }
    })

    // Add footer with background
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)

      // Footer background
      doc.setFillColor(...lightBlue)
      doc.rect(0, doc.internal.pageSize.height - 15, pageWidth, 15, "F")

      // Page numbers
      doc.setTextColor(...darkGray)
      doc.setFontSize(8)
      doc.setFont("Helvetica", "normal")
      doc.text(`Page ${i} of ${pageCount}`, 105, doc.internal.pageSize.height - 7, { align: "center" })

      // Add generation date
      const today = new Date()
      const dateStr = today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      doc.text(`Generated on: ${dateStr}`, pageWidth - 15, doc.internal.pageSize.height - 7, { align: "right" })

      // Add copyright or institution name
      doc.text("University Management System", 15, doc.internal.pageSize.height - 7, { align: "left" })
    }

    // Return the document instead of saving directly
    return doc
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF")
  }
}

// Helper function to load image
const loadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = src
    img.onload = () => resolve(img)
  })
}
