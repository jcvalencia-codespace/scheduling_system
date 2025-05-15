import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

// Add helper function for loading images
const loadImage = (src) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
};

const SchedulePDF = ({ activeTerm, schedules, selectedSection }) => {
  const generatePDF = async () => {
    const doc = new jsPDF();

    try {
      // Load header image first
      const headerImg = await loadImage("https://i.imgur.com/6yZFd27.png").catch(() => null);
      const imgWidth = 40;
      const imgHeight = 12;
      
      if (headerImg) {
        // Center the image horizontally
        const xPosition = (doc.internal.pageSize.width - imgWidth) / 2;
        doc.addImage(headerImg, "PNG", xPosition, 2, imgWidth, imgHeight);
      }

      // Add header text
      doc.setFontSize(12); // Changed from 14
      doc.setTextColor(26, 35, 126);
      doc.text('Class Schedule', doc.internal.pageSize.width / 2, 20, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setTextColor(0);
      doc.text(`Schedule for: ${selectedSection}`, doc.internal.pageSize.width / 2, 26, { align: 'center' });
      doc.text(`${activeTerm.term} - AY ${activeTerm.academicYear}`, doc.internal.pageSize.width / 2, 31, { align: 'center' });

      // Generate time slots
      const timeSlots = generateTimeSlots();
      const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      // Calculate rowspan for each schedule
      const scheduleSpans = calculateScheduleSpans(timeSlots, weekDays);

      // Prepare table data with rowspans
      const tableData = [];
      timeSlots.forEach((time, timeIndex) => {
        const row = [time];

        weekDays.forEach((day, dayIndex) => {
          const schedule = getScheduleForTimeAndDay(time, day);
          const slot = getSlotForTimeAndDay(schedule, time, day);

          // Check if this is a cell that should be displayed or skipped due to rowspan
          const spanInfo = scheduleSpans[`${timeIndex}-${dayIndex}`];

          if (spanInfo && spanInfo.isStart) {
            // This is the start of a schedule block
            const content = [
              `${spanInfo.slot.timeFrom} - ${spanInfo.slot.timeTo}`,
              schedule.subject?.subjectCode || '',
              schedule.section?.sectionName || '', // Add section name for faculty view
              spanInfo.slot.room?.roomCode || '',
              schedule.faculty ? `${schedule.faculty.firstName?.[0]}.${schedule.faculty.lastName}` : ''
            ].join('\n');

            row.push({ content, rowSpan: spanInfo.span });
          } else if (spanInfo && !spanInfo.isStart) {
            // This cell is covered by a rowspan, so we skip it
            row.push({ content: '', rowSpan: 0 });
          } else {
            // Empty cell
            row.push('');
          }
        });

        tableData.push(row);
      });

      // Calculate column widths - equal for all day columns
      const pageWidthForTable = doc.internal.pageSize.width;
      const leftMargin = 3; // Reduced left margin
      const rightMargin = 3; // Reduced right margin
      const timeColWidth = 18; // Time column width
      const dayColWidth = (pageWidthForTable - timeColWidth - leftMargin - rightMargin) / weekDays.length; // More space for day columns

      const columnStyles = {
        0: { cellWidth: timeColWidth }
      };

      // Set equal width for all day columns
      weekDays.forEach((_, index) => {
        columnStyles[index + 1] = { cellWidth: dayColWidth };
      });

      // Draw table using autoTable plugin with adjusted settings
      autoTable(doc, {
        startY: 35,
        margin: { left: leftMargin, right: rightMargin, top: 35 }, // Changed from 40
        head: [['Time', ...weekDays]],
        body: tableData,
        theme: 'plain',
        headStyles: {
          fillColor: [26, 35, 126],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          lineWidth: 0.2,
          lineColor: [0, 0, 0],
          halign: 'center',
          valign: 'middle'
        },
        bodyStyles: {
          fontSize: 8,
          lineWidth: 0.2,
          lineColor: [0, 0, 0],
          cellPadding: 1
        },
        columnStyles: columnStyles,
        styles: {
          cellPadding: 3,
          valign: 'middle',
          halign: 'center',
          overflow: 'linebreak',
          lineColor: [0, 0, 0]
        },
        didParseCell: function (data) {
          // Style the header row consistently
          if (data.section === 'head') {
            data.cell.styles.fillColor = [26, 35, 126];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = 'bold';
          }

          // Style schedule cells
          if (data.section === 'body' && data.column.index > 0) {
            const timeIndex = data.row.index;
            const dayIndex = data.column.index - 1;
            const spanInfo = scheduleSpans[`${timeIndex}-${dayIndex}`];

            if (spanInfo && spanInfo.isStart) {
              // This is a schedule cell
              data.cell.styles.fillColor = [255, 215, 0]; // Gold background
              data.cell.styles.lineWidth = 0.1;
              data.cell.styles.lineColor = [0, 0, 0];
            }
          }
        }
      });

      // Add issue date and time at the bottom
      const currentDate = new Date();
      const dateStr = currentDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      const timeStr = currentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(`Issued on ${dateStr} at ${timeStr}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
     
     
      return doc;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error("Failed to generate PDF");
    }
  };

  // Calculate rowspans for each schedule block
  const calculateScheduleSpans = (timeSlots, weekDays) => {
    const spans = {};

    timeSlots.forEach((time, timeIndex) => {
      weekDays.forEach((day, dayIndex) => {
        const schedule = getScheduleForTimeAndDay(time, day);
        const slot = getSlotForTimeAndDay(schedule, time, day);

        if (slot && isFirstTimeSlot(time, slot)) {
          // Calculate how many time slots this schedule spans
          let span = 0;
          const startTime = new Date(`2000/01/01 ${slot.timeFrom}`).getTime();
          const endTime = new Date(`2000/01/01 ${slot.timeTo}`).getTime();

          for (let i = timeIndex; i < timeSlots.length; i++) {
            const slotTime = new Date(`2000/01/01 ${timeSlots[i]}`).getTime();
            if (slotTime >= startTime && slotTime < endTime) {
              span++;

              // Mark cells that are part of this span but not the start
              if (i > timeIndex) {
                spans[`${i}-${dayIndex}`] = { isStart: false };
              }
            }
          }

          spans[`${timeIndex}-${dayIndex}`] = {
            isStart: true,
            span: span,
            slot: slot
          };
        }
      });
    });

    return spans;
  };

  const generateTimeSlots = () => {
    const slots = [];
    let hour = 7;
    let minute = 0;

    while (hour < 22) {
      const time = new Date(2000, 0, 1, hour, minute);
      slots.push(time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));

      minute += 20;
      if (minute >= 60) {
        minute = 0;
        hour++;
      }
    }
    return slots;
  };

  const getScheduleForTimeAndDay = (time, day) => {
    // If type is faculty, don't filter by section
    return schedules.find(schedule => {
      return schedule.scheduleSlots.some(slot => {
        const scheduleStartTime = new Date(`2000/01/01 ${slot.timeFrom}`).getTime();
        const scheduleEndTime = new Date(`2000/01/01 ${slot.timeTo}`).getTime();
        const currentTime = new Date(`2000/01/01 ${time}`).getTime();

        return slot.days.includes(day) &&
          currentTime >= scheduleStartTime &&
          currentTime < scheduleEndTime;
      });
    });
  };

  const getSlotForTimeAndDay = (schedule, time, day) => {
    if (!schedule || !schedule.scheduleSlots) return null;

    return schedule.scheduleSlots.find(slot => {
      const scheduleStartTime = new Date(`2000/01/01 ${slot.timeFrom}`).getTime();
      const scheduleEndTime = new Date(`2000/01/01 ${slot.timeTo}`).getTime();
      const currentTime = new Date(`2000/01/01 ${time}`).getTime();

      return slot.days.includes(day) &&
        currentTime >= scheduleStartTime &&
        currentTime < scheduleEndTime;
    });
  };

  const isFirstTimeSlot = (currentTime, slot) => {
    if (!slot || !slot.timeFrom || !currentTime) return false;

    const slotStartTime = new Date(`2000/01/01 ${slot.timeFrom}`).getTime();
    const currentTimeDate = new Date(`2000/01/01 ${currentTime}`).getTime();
    return slotStartTime === currentTimeDate;
  };

  return generatePDF();
};

export default SchedulePDF;
