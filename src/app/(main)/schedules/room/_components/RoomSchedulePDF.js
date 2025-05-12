import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const RoomSchedulePDF = ({ activeTerm, schedules, selectedSection }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Center logo calculation
    const pageWidth = doc.internal.pageSize.width;
    const logoWidth = 40;
    const logoX = (pageWidth - logoWidth) / 2;
    
    // Load and add image using canvas
    const logo = new Image();
    logo.src = 'https://i.imgur.com/6yZFd27.png';
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    logo.onload = () => {
      canvas.width = logo.width;
      canvas.height = logo.height;
      ctx.drawImage(logo, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      doc.addImage(dataUrl, 'PNG', logoX, 5, logoWidth, 12);
    };
    
    // Add header text directly without logo
    doc.setFontSize(16);
    doc.setTextColor(26, 35, 126);
    doc.text('Room Schedule', doc.internal.pageSize.width / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Room: ${selectedSection}`, doc.internal.pageSize.width / 2, 27, { align: 'center' });
    doc.text(`${activeTerm.term} - AY ${activeTerm.academicYear}`, doc.internal.pageSize.width / 2, 32, { align: 'center' });

    // Prepare and generate table
    const timeSlots = generateTimeSlots();
    const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const scheduleSpans = calculateScheduleSpans(timeSlots, weekDays);
    
    // Prepare table data with rowspans
    const tableData = [];
    timeSlots.forEach((time, timeIndex) => {
      const row = [time];
      
      weekDays.forEach((day, dayIndex) => {
        const schedule = getScheduleForTimeAndDay(time, day);
        const slot = getSlotForTimeAndDay(schedule, time, day);
        
        const spanInfo = scheduleSpans[`${timeIndex}-${dayIndex}`];
        
        if (spanInfo && spanInfo.isStart) {
          const content = generateTableContent(schedule, spanInfo.slot);
          
          row.push({ content, rowSpan: spanInfo.span });
        } else if (spanInfo && !spanInfo.isStart) {
          row.push({ content: '', rowSpan: 0 });
        } else {
          row.push('');
        }
      });
      
      tableData.push(row);
    });

    // Add table with adjusted starting position
    autoTable(doc, {
      startY: 37, // Adjusted to account for added logo
      margin: { left: 3, right: 3, top: 40 },
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
      columnStyles: getColumnStyles(weekDays.length),
      styles: {
        cellPadding: 3,
        valign: 'middle',
        halign: 'center',
        overflow: 'linebreak',
        lineColor: [0, 0, 0]
      },
      didParseCell: function(data) {
        if (data.section === 'head') {
          data.cell.styles.fillColor = [26, 35, 126];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
        
        if (data.section === 'body' && data.column.index > 0) {
          const timeIndex = data.row.index;
          const dayIndex = data.column.index - 1;
          const spanInfo = scheduleSpans[`${timeIndex}-${dayIndex}`];
          
          if (spanInfo && spanInfo.isStart) {
            data.cell.styles.fillColor = [255, 215, 0];
            data.cell.styles.lineWidth = 0.1;
            data.cell.styles.lineColor = [0, 0, 0];
          }
        }
      }
    });

    return doc;
  };

  const calculateScheduleSpans = (timeSlots, weekDays) => {
    const spans = {};
    
    timeSlots.forEach((time, timeIndex) => {
      weekDays.forEach((day, dayIndex) => {
        const schedule = getScheduleForTimeAndDay(time, day);
        const slot = getSlotForTimeAndDay(schedule, time, day);
        
        if (slot && isFirstTimeSlot(time, slot)) {
          let span = 0;
          const startTime = new Date(`2000/01/01 ${slot.timeFrom}`).getTime();
          const endTime = new Date(`2000/01/01 ${slot.timeTo}`).getTime();
          
          for (let i = timeIndex; i < timeSlots.length; i++) {
            const slotTime = new Date(`2000/01/01 ${timeSlots[i]}`).getTime();
            if (slotTime >= startTime && slotTime < endTime) {
              span++;
              
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

  const getColumnStyles = (dayCount) => {
    const pageWidth = 210; // A4 width in mm
    const margins = 6; // Left + right margins
    const timeColWidth = 18;
    const dayColWidth = (pageWidth - timeColWidth - margins) / dayCount;
    
    const styles = { 0: { cellWidth: timeColWidth } };
    for (let i = 1; i <= dayCount; i++) {
      styles[i] = { cellWidth: dayColWidth };
    }
    return styles;
  };

  const generateTableContent = (schedule, slot) => {
    if (!schedule || !slot) return '';
    
    // Handle sections display
    const sectionDisplay = schedule.section 
      ? Array.isArray(schedule.section)
        ? schedule.section.map(s => s.sectionName).join(', ')
        : schedule.section.sectionName
      : 'N/A';

    return [
      `${slot.timeFrom} - ${slot.timeTo}`,
      schedule.subject?.subjectCode || '',
      // schedule.subject?.subjectName || '',
      `${sectionDisplay}`,
      `${schedule.faculty ? `${schedule.faculty.firstName?.[0]}. ${schedule.faculty.lastName}` : 'TBA'}`,
    ].join('\n');
  };

  return generatePDF();
};

export default RoomSchedulePDF;
