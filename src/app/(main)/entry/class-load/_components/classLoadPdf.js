"use client"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export const generateClassLoadPDF = async (assignments, selectedCourse, selectedTerm) => {
  const doc = new jsPDF()

  try {
    // Load header image first
    const headerImg = await loadImage("https://i.imgur.com/6yZFd27.png").catch(() => null)
    const imgWidth = 40
    const imgHeight = 12
    // Document margins and dimensions
    const margin = 10
    const pageWidth = doc.internal.pageSize.width
    const contentWidth = pageWidth - margin * 2
    const startY = 15

    // Set default font
    doc.setFont("Helvetica")

    // Define modern color palette
    const primaryColor = [13, 71, 161] // #2962FF - Modern blue
    const secondaryColor = [13, 71, 161] // #0D47A1 - Darker blue
    const accentColor = [13, 71, 161] // #00B0FF - Light blue accent
    const lightGray = [245, 247, 250] //rgb(255, 255, 255) - Light background
    const darkGray = [33, 33, 33] // #212121 - Near black
    const mediumGray = [97, 97, 97] // #616161 - Medium gray

    // Remove header background
    // Add logo if image loaded successfully
    if (headerImg) {
      // Center the image horizontally
      const xPosition = (pageWidth - imgWidth) / 2
      doc.addImage(headerImg, "PNG", xPosition, 2, imgWidth, imgHeight)

      // Add centered description under header image with more bottom margin
      doc.setFontSize(12)
      doc.setTextColor(...darkGray)
      doc.setFont("Helvetica", "bold")
      doc.text("Class Load Report", pageWidth / 2, imgHeight + 8, { align: "center" })
    }

    // Add a separator line with more spacing
    doc.setDrawColor(...accentColor)
    doc.setLineWidth(0.5)
    doc.line(margin, startY + 15, pageWidth - margin, startY + 15)

    // Adjust metadata section position with more spacing
    doc.setFillColor(...lightGray)
    doc.roundedRect(margin, startY + 20, contentWidth, 20, 2, 2, "F")

    // Adjust metadata content positions
    const metadataY = 40 // Increased from 32
    const col1X = margin + 5
    const col2X = margin + 35
    const col3X = pageWidth / 2
    const col4X = pageWidth / 2 + 30

    doc.setTextColor(...darkGray)
    doc.setFontSize(8)
    doc.setFont("Helvetica", "bold")
    doc.text("COURSE:", col1X, metadataY)
    // doc.text("CODE:", col3X, metadataY + 8)
    doc.text("ACADEMIC YEAR:", col1X, metadataY + 8)
    doc.text("TERM:", col3X, metadataY + 8)

    doc.setFont("Helvetica", "normal")
    doc.setFontSize(9)
    doc.text(selectedCourse.courseTitle, col2X, metadataY)
    // doc.text(selectedCourse.courseCode, col4X, metadataY)
    doc.text(selectedTerm.sy, col2X, metadataY + 8)
    doc.text(`Term ${selectedTerm.term}`, col4X, metadataY + 8)

    // Filter assignments for selected course
    const courseAssignments = assignments.filter((a) => a.classId?.course?.courseCode === selectedCourse.courseCode)

    // Group assignments by year level
    const groupedByYear = courseAssignments.reduce((acc, curr) => {
      const yearLevel = curr.yearLevel
      if (!acc[yearLevel]) acc[yearLevel] = []
      acc[yearLevel].push(curr)
      return acc
    }, {})

    // Adjust starting position for tables
    let currentY = 65 // Increased from 55

    // Initialize total course hours
    let totalCourseHours = 0

    // Generate tables for each year level
    Object.entries(groupedByYear).forEach(([yearLevel, yearAssignments]) => {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage()
        currentY = 20
      }

      // Year level header with modern styling
      doc.setFillColor(...primaryColor)
      doc.roundedRect(margin, currentY - 4, contentWidth, 8, 1, 1, "F")

      doc.setTextColor(255, 255, 255) // White
      doc.setFontSize(9)
      doc.setFont("Helvetica", "bold")
      doc.text(`${yearLevel} Year`, margin + 5, currentY, { align: "left" })
      currentY += 8

      // Process data for the table with one subject per row
      let hasSubjects = false
      const tableData = []
      let yearTotalHours = 0

      yearAssignments.forEach((assignment) => {
        const termSubjects = assignment.subjects.filter((s) => s.term === selectedTerm.term)
        let sectionTotalHours = 0

        if (termSubjects.length > 0) {
          hasSubjects = true

          // Calculate section total first
          sectionTotalHours = termSubjects.reduce((total, subject) => {
            return total + (parseFloat(subject.hours) || 0);
          }, 0);

          // Add each subject as a separate row
          termSubjects.forEach((subject, index) => {
            const hours = parseFloat(subject.hours) || 0
            yearTotalHours += hours
            totalCourseHours += hours

            const row = []
            if (index === 0) {
              row.push({
                content: assignment.classId?.sectionName || "",
                rowSpan: termSubjects.length, // Remove +1 since we'll add section total separately
              })
            }

            row.push(subject.subject?.subjectCode || "")
            row.push(subject.subject?.subjectName || "")
            row.push(hours || "N/A")
            tableData.push(row)
          })

          // Add section total as a separate row with styling
          tableData.push([
            { content: "Section Total:", colSpan: 3, styles: { fontStyle: "bold", fillColor: [245, 247, 250] } },
            { content: sectionTotalHours, styles: { fontStyle: "bold", fillColor: [245, 247, 250], halign: "center" } }
          ])

          // Add empty row for spacing
          tableData.push([{ content: "", colSpan: 4 }])
        }
      })

      if (hasSubjects) {
        // Generate table with modern styling
        const tableConfig = {
          startY: currentY,
          head: [["Section", "Code", "Subject", "Hours"]],
          body: tableData,
          theme: "grid",
          styles: {
            fontSize: 8,
            textColor: [...darkGray],
            font: "Helvetica",
            cellPadding: 3,
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [...secondaryColor],
            textColor: [255, 255, 255],
            font: "Helvetica",
            fontStyle: "bold",
            halign: "center",
            fontSize: 8,
          },
          columnStyles: {
            0: { fontStyle: "bold", halign: "left", cellWidth: 30 },
            1: { halign: "left", cellWidth: 25 },
            2: { halign: "left" },
            3: { halign: "center", cellWidth: 20 },
          },
          // Add styles for total rows
          didParseCell: function(data) {
            // Enhance cell merging for sections
            if (data.column.index === 0 && data.cell.text) {
              data.cell.styles.valign = 'middle';  // Center vertically
            }
            if (data.cell.text && data.cell.text.includes('Total')) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [245, 247, 250];
            }
          }
        }

        // Draw the table
        autoTable(doc, tableConfig)

        // Add year total
        currentY = doc.lastAutoTable.finalY + 5
        doc.setFont("Helvetica", "bold")
        doc.setFontSize(9)
        doc.setTextColor(...darkGray)
        doc.text(
          `${yearLevel} Year Total Hours: ${yearTotalHours}`,
          pageWidth - margin - 50,
          currentY,
          { align: "right" }
        )
        currentY += 15
      } else {
        doc.setTextColor(...mediumGray)
        doc.setFontSize(8)
        doc.setFont("Helvetica", "italic")
        doc.text("No subjects assigned for this term", pageWidth / 2, currentY + 5, { align: "center" })
        currentY += 15
      }
    })

    // Add grand total for the course
    if (totalCourseHours > 0) {
      // Add a separator line
      doc.setDrawColor(...accentColor)
      doc.setLineWidth(0.5)
      doc.line(margin, currentY, pageWidth - margin, currentY)
      currentY += 10

      // Add course total with larger font and bold
      doc.setFont("Helvetica", "bold")
      doc.setFontSize(11)
      doc.setTextColor(...primaryColor)
      doc.text(
        `Total Course Hours: ${totalCourseHours}`,
        pageWidth - margin,
        currentY,
        { align: "right" }
      )
    }

    // Add footer with modern styling
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)

      // Footer separator line
      doc.setDrawColor(...lightGray)
      doc.setLineWidth(0.5)
      doc.line(margin, doc.internal.pageSize.height - 10, pageWidth - margin, doc.internal.pageSize.height - 10)

      // Page numbers
      doc.setTextColor(...mediumGray)
      doc.setFontSize(7)
      doc.setFont("Helvetica", "normal")
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 5, { align: "right" })

      // Add generation date
      const today = new Date()
      const dateStr = today.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      doc.text(`Generated: ${dateStr}`, margin, doc.internal.pageSize.height - 5, { align: "left" })

      // Add watermark or institution name in the center
      doc.setTextColor(...accentColor)
      doc.setFontSize(7)
      doc.text("University Management System", pageWidth / 2, doc.internal.pageSize.height - 5, { align: "center" })
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
