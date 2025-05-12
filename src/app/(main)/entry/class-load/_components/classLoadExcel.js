"use client"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

export const generateClassLoadExcel = async (assignments = [], selectedCourse, selectedTerm) => {
  try {
    if (!assignments || !Array.isArray(assignments)) {
      throw new Error("Invalid assignments data")
    }

    if (!selectedCourse || !selectedTerm) {
      throw new Error("Course or term not selected")
    }

    // Filter assignments for selected course
    const courseAssignments = assignments.filter((a) => a.classId?.course?.courseCode === selectedCourse.courseCode)

    // Group assignments by year level
    const groupedByYear = courseAssignments.reduce((acc, curr) => {
      const yearLevel = curr.yearLevel
      if (!acc[yearLevel]) acc[yearLevel] = []
      acc[yearLevel].push(curr)
      return acc
    }, {})

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Set workbook properties for better metadata
    wb.Props = {
      Title: `Class Load Report - ${selectedCourse.courseCode}`,
      Subject: "Class Load",
      Author: "University Management System",
      CreatedDate: new Date(),
    }

    // Create summary worksheet
    const summary_ws_data = []
    
    // Add university name and report title
    summary_ws_data.push([])
    summary_ws_data.push([])
    summary_ws_data.push(["UNIVERSITY MANAGEMENT SYSTEM"])
    summary_ws_data.push(["CLASS LOAD REPORT"])
    summary_ws_data.push([])

    // Add report information
    const reportDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    summary_ws_data.push(["REPORT DETAILS"])
    summary_ws_data.push(["Course Code:", selectedCourse.courseCode, "Generated On:", reportDate])
    summary_ws_data.push(["Course Title:", selectedCourse.courseTitle, "Academic Year:", selectedTerm.sy])
    summary_ws_data.push(["Department:", selectedCourse.department || "N/A", "Term:", `Term ${selectedTerm.term}`])
    summary_ws_data.push([])

    // Add summary section
    const totalSections = Object.values(groupedByYear).reduce(
      (total, yearAssignments) => total + yearAssignments.length,
      0,
    )

    const totalSubjects = Object.values(groupedByYear).reduce((total, yearAssignments) => {
      return total + yearAssignments.reduce((sectionTotal, assignment) => {
        return sectionTotal + assignment.subjects.filter((s) => s.term === selectedTerm.term).length
      }, 0)
    }, 0)

    summary_ws_data.push(["SUMMARY"])
    summary_ws_data.push(["Total Year Levels:", Object.keys(groupedByYear).length])
    summary_ws_data.push(["Total Sections:", totalSections])
    summary_ws_data.push(["Total Subjects:", totalSubjects])

    // Create and style summary worksheet
    const summary_ws = XLSX.utils.aoa_to_sheet(summary_ws_data)
    XLSX.utils.book_append_sheet(wb, summary_ws, "Summary")

    // Track grand total hours
    let grandTotalHours = 0

    // Process each year level in separate worksheets
    Object.entries(groupedByYear).forEach(([yearLevel, yearAssignments]) => {
      const ws_data = []
      let yearTotalHours = 0
      const merges = [] // Move merges declaration here

      // Add sheet title and headers (3 rows)
      ws_data.push([`${yearLevel.toUpperCase()} YEAR CLASS LOAD`])
      ws_data.push([])
      ws_data.push(["SECTION", "SUBJECT CODE", "SUBJECT NAME", "HOURS"])

      let currentRow = 3 // Start after headers

      yearAssignments.forEach((assignment) => {
        const termSubjects = assignment.subjects.filter((s) => s.term === selectedTerm.term)
        if (termSubjects.length > 0) {
          let sectionTotalHours = 0
          const sectionStartRow = currentRow

          termSubjects.forEach((subject) => {
            const hours = Number.parseFloat(subject.hours) || 0
            sectionTotalHours += hours
            yearTotalHours += hours
            grandTotalHours += hours

            ws_data.push([
              assignment.classId?.sectionName || "",
              subject.subject?.subjectCode || "",
              subject.subject?.subjectName || "",
              hours || "N/A",
            ])
            currentRow++
          })

          // Merge section cells
          if (termSubjects.length > 0) {
            merges.push({
              s: { r: sectionStartRow, c: 0 },
              e: { r: currentRow - 1, c: 0 }
            })
          }

          // Add section total and spacing
          ws_data.push(["", "", `SECTION ${assignment.classId?.sectionName} TOTAL`, sectionTotalHours])
          ws_data.push([]) // Empty row for spacing
          currentRow += 2
        }
      })

      // Add year total
      ws_data.push(["", "", "YEAR TOTAL", yearTotalHours])

      // Create worksheet and apply styles
      const ws = XLSX.utils.aoa_to_sheet(ws_data)

      // Set column widths
      ws["!cols"] = [
        { wch: 15 }, // Section
        { wch: 15 }, // Subject Code
        { wch: 50 }, // Subject Name
        { wch: 10 }, // Hours
      ]

      // Apply merges
      ws["!merges"] = merges

      // Apply styles to merged cells
      merges.forEach(merge => {
        const cellAddress = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c })
        ws[cellAddress] = {
          v: ws[cellAddress]?.v || "",
          t: "s",
          s: {
            font: { bold: true, sz: 12 },
            alignment: { horizontal: "center", vertical: "center" },
            fill: { fgColor: { rgb: "F0F0F0" } }
          }
        }
      })

      // Add the worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, `${yearLevel} Year`)
    })

    // Update summary with grand total
    summary_ws_data.push([])
    summary_ws_data.push(["GRAND TOTAL HOURS:", "", "", grandTotalHours])
    summary_ws_data.push([])
    summary_ws_data.push(["Generated by University Management System", "", "Report ID:", generateReportId()])

    // Regenerate summary worksheet with grand total
    const final_summary_ws = XLSX.utils.aoa_to_sheet(summary_ws_data)
    wb.Sheets["Summary"] = final_summary_ws

    // Generate and return the file as a Promise
    return new Promise((resolve, reject) => {
      try {
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })

        // Add logo information for the UI to display
        // Since xlsx doesn't support direct image embedding, we'll return info about the logo
        // so the UI can display it separately if needed
        resolve({
          blob,
          fileName: `ClassLoad_${selectedCourse.courseCode}_Term${selectedTerm.term}.xlsx`,
          logoPath: "https://i.imgur.com/6yZFd27.png",
        })
      } catch (error) {
        reject(error)
      }
    })
  } catch (error) {
    console.error("Error generating Excel:", error)
    throw new Error("Failed to generate Excel file")
  }
}

// Helper function to generate a unique report ID
const generateReportId = () => {
  return "RPT-" + Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Helper function to download the Excel file
export const downloadExcel = (excelData) => {
  if (!excelData || !excelData.blob) return

  saveAs(excelData.blob, excelData.fileName)
}

// Helper function for logo (not used directly in Excel generation due to xlsx limitations)
// but can be used by the UI to display the logo
export const getLogoUrl = () => {
  return "https://i.imgur.com/6yZFd27.png"
}
