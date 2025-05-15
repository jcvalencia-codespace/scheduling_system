import jsPDF from 'jspdf';

const generatePDF = (props, isPreview = false) => {
  const { activeTerm, schedules, selectedSection } = props;
  const timeSlots = generateTimeSlots();
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const doc = new jsPDF();
  
  // Track schedule spans
  const scheduleSpans = {};
  
  // Calculate spans first
  timeSlots.forEach((time, timeIndex) => {
    weekDays.forEach((day, dayIndex) => {
      const schedule = schedules.find(s => 
        s.section?.sectionName === selectedSection &&
        s.scheduleSlots.some(slot => 
          slot.days.includes(day) &&
          new Date(`2000/01/01 ${time}`).getTime() === new Date(`2000/01/01 ${slot.timeFrom}`).getTime()
        )
      );
      
      if (schedule && !scheduleSpans[`${timeIndex}-${dayIndex}`]) {
        const slot = schedule.scheduleSlots.find(s => s.days.includes(day));
        let span = 0;
        for (let i = timeIndex; i < timeSlots.length; i++) {
          const currentTime = new Date(`2000/01/01 ${timeSlots[i]}`).getTime();
          const endTime = new Date(`2000/01/01 ${slot.timeTo}`).getTime();
          if (currentTime < endTime) {
            span++;
            if (i > timeIndex) {
              scheduleSpans[`${i}-${dayIndex}`] = { isSpanned: true };
            }
          } else break;
        }
        scheduleSpans[`${timeIndex}-${dayIndex}`] = { span, slot, schedule };
      }
    });
  });

  // Set font
  doc.setFont("helvetica");
  
  // Get page width and calculate logo position
  const pageWidth = doc.internal.pageSize.width;
  const logoWidth = 50;
  const logoHeight = 15;
  const logoX = (pageWidth - logoWidth) / 2;
  
  // Add header with centered logo
  doc.addImage("https://i.imgur.com/6yZFd27.png", "PNG", logoX, 5, logoWidth, logoHeight);
  
  // Add titles with reduced spacing
  doc.setFontSize(12);
  doc.setTextColor(26, 35, 126);
  doc.text("Archived Class Schedule", 105, 25, { align: "center" }); // Changed title

  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text(`Section: ${selectedSection}`, 105, 30, { align: "center" }); // Changed label
  doc.text(`${activeTerm.term} - AY ${activeTerm.academicYear}`, 105, 35, { align: "center" });
  
  // Draw table with adjusted dimensions
  const cellHeight = 5.5; // Reduced cell height for better fit
  const timeWidth = 25; // Keep original width
  const dayWidth = 27; // Keep original width

  // Calculate table dimensions with adjusted height
  const pageHeight = doc.internal.pageSize.height;
  const tableWidth = timeWidth + (dayWidth * weekDays.length);
  const tableHeight = cellHeight * (timeSlots.length + 1);
  const startX = (pageWidth - tableWidth) / 2;
  const startY = 40; // Move table up

  // Draw outer table border and fill
  doc.setDrawColor(0);
  doc.setFillColor(255, 255, 255);
  doc.rect(startX, startY, tableWidth, tableHeight, 'FD');
  
  // Draw days row with proper spacing
  doc.setFillColor(26, 35, 126);
  doc.setTextColor(255);
  doc.setFontSize(7);
  
  // Time header (top-left corner)
  doc.rect(startX, startY, timeWidth, cellHeight, 'F');
  doc.text("Time", startX + timeWidth/2, startY + 5, { 
    align: "center",
    baseline: "middle"
  });
  
  // Day headers with proper spacing
  weekDays.forEach((day, index) => {
    const x = startX + timeWidth + (dayWidth * index);
    // Fill background
    doc.setFillColor(26, 35, 126);
    doc.rect(x, startY, dayWidth, cellHeight, 'F');
    
    // Add text with better positioning and contrast
    doc.setTextColor(255, 255, 255); // Ensure white text
    doc.setFontSize(7);
    doc.text(day, x + (dayWidth/2), startY + (cellHeight/2), { 
      align: "center",
      baseline: "middle",
      maxWidth: dayWidth
    });
  });
  
  // Draw time slots
  doc.setTextColor(0);
  timeSlots.forEach((time, index) => {
    const y = startY + ((index + 1) * cellHeight);
    
    // Time cell
    doc.rect(startX, y, timeWidth, cellHeight);
    doc.setFontSize(6); // Increased font size for time
    doc.text(time, startX + timeWidth/2, y + 3.5, { align: "center" });
    
    // Day cells
    weekDays.forEach((day, dayIndex) => {
      const x = startX + timeWidth + (dayWidth * dayIndex);
      const spanInfo = scheduleSpans[`${index}-${dayIndex}`];
      
      if (!spanInfo?.isSpanned) {
        doc.rect(x, y, dayWidth, cellHeight);
        
        if (spanInfo?.span) {
          // Draw schedule cell with perfect fit
          doc.setFillColor(255, 215, 0);
          doc.rect(x + 0.1, y + 0.1, dayWidth - 0.2, (spanInfo.span * cellHeight) - 0.1, 'F');
          
          // Adjust text positioning and size
          doc.setFontSize(5);
          doc.setTextColor(0);
          
          // Calculate vertical center position
          const cellTotalHeight = spanInfo.span * cellHeight;
          const textStartY = y + (cellTotalHeight / 2) - 3;
          
          doc.text([
            `${spanInfo.slot.timeFrom} - ${spanInfo.slot.timeTo}`,
            spanInfo.schedule.subject?.subjectCode || "",
            spanInfo.slot.room?.roomCode || "",
            spanInfo.schedule.faculty ? 
              `${spanInfo.schedule.faculty.firstName?.[0]}.${spanInfo.schedule.faculty.lastName}` : ""
          ], x + (dayWidth/2), textStartY, { 
            align: "center",
            maxWidth: dayWidth - 1,
            lineHeightFactor: 1.3
          });
        }
      }
    });
  });
  
  // Add footer
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric"
  });
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true
  });
  
  const footerY = startY + tableHeight + 10;
  doc.setFontSize(8);
  doc.text(`Issued on ${currentDate} at ${currentTime}`, 105, footerY, { align: "center" });
  
  if (!isPreview) {
    doc.save(`archived-schedule-${selectedSection}-${activeTerm.term}-${activeTerm.academicYear}.pdf`); // Changed filename
  }
  
  return doc;
};

const generateTimeSlots = () => {
  const slots = []
  let hour = 7
  let minute = 0

  while (hour < 22) {
    const time = new Date(2000, 0, 1, hour, minute)
    slots.push(
      time.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        hourCycle: "h12",
      }),
    )

    minute += 20
    if (minute >= 60) {
      minute = 0
      hour++
    }
  }
  return slots
}

export default generatePDF;
