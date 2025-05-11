import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const SchedulePDF = ({ activeTerm, schedules, selectedSection }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Center logo calculation
    const pageWidth = doc.internal.pageSize.width;
    const logoWidth = 40;
    const logoX = (pageWidth - logoWidth) / 2;
    
    // Load and add image using base64 string
    const logo = new Image();
    logo.src = '/logo-header.png'; // Update this path to match where you place the image in public folder
    
    // Convert image to data URL and add to PDF
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    logo.onload = () => {
      canvas.width = logo.width;
      canvas.height = logo.height;
      ctx.drawImage(logo, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      doc.addImage(dataUrl, 'PNG', logoX, 5, logoWidth, 12);
    };

    // Add header
    doc.setFontSize(14);
    doc.setTextColor(26, 35, 126);
    doc.text('Class Schedule', doc.internal.pageSize.width / 2, 22, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text(`Schedule for: ${selectedSection}`, doc.internal.pageSize.width / 2, 28, { align: 'center' });
    doc.text(`${activeTerm.term} - AY ${activeTerm.academicYear}`, doc.internal.pageSize.width / 2, 33, { align: 'center' });

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
      margin: { left: leftMargin, right: rightMargin, top: 40 },
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
      didParseCell: function(data) {
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

    return doc;
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
    return schedules.filter(schedule => 
      schedule.section?.sectionName === selectedSection
    ).find(schedule => {
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