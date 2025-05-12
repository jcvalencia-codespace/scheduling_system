import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const FacultySchedulePDF = ({ activeTerm, schedules, selectedSection, adminHours = [] }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    // Remove logo handling since it causes CORS issues
    // Just add header text directly
    doc.setFontSize(14);
    doc.setTextColor(26, 35, 126);
    doc.text('Faculty Schedule', doc.internal.pageSize.width / 2, 15, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text(`Faculty: ${selectedSection}`, doc.internal.pageSize.width / 2, 22, { align: 'center' });
    doc.text(`${activeTerm.term} - AY ${activeTerm.academicYear}`, doc.internal.pageSize.width / 2, 27, { align: 'center' });

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
        
        const spanInfo = scheduleSpans[`${timeIndex}-${dayIndex}`];
        
        if (spanInfo && spanInfo.isStart) {
          // Simplified content based on whether it's admin hours or regular schedule
          const content = schedule.isAdminHours 
            ? [
                `${spanInfo.slot.timeFrom} - ${spanInfo.slot.timeTo}`,
                'Admin Hours'
              ].join('\n')
            : [
                `${spanInfo.slot.timeFrom} - ${spanInfo.slot.timeTo}`,
                schedule.subject?.subjectCode || '',
                `${schedule.section?.sectionName || 'N/A'}`,
                `${spanInfo.slot.room?.roomCode || 'N/A'}`,
              ].join('\n');
          
          row.push({ content, rowSpan: spanInfo.span });
        } else if (spanInfo && !spanInfo.isStart) {
          row.push({ content: '', rowSpan: 0 });
        } else {
          row.push('');
        }
      });
      
      tableData.push(row);
    });

    // Use the same table styling as SchedulePDF
    autoTable(doc, {
      startY: 30, // Adjusted starting position since we removed the logo
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
            data.cell.styles.fillColor = spanInfo.isAdminHours 
              ? [155, 233, 203] //rgb(155, 233, 203) for admin hours
              : [255, 215, 0];  // Original color for regular schedules
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
  };

  const calculateScheduleSpans = (timeSlots, weekDays) => {
    const spans = {};
    
    timeSlots.forEach((time, timeIndex) => {
      weekDays.forEach((day, dayIndex) => {
        const schedule = getScheduleForTimeAndDay(time, day);
        const slot = getSlotForTimeAndDay(schedule, time, day);
        
        if (slot && isFirstTimeSlot(time, schedule.isAdminHours ? slot.timeFrom : slot.timeFrom)) {
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
            slot: slot,
            isAdminHours: schedule.isAdminHours
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
    // First check regular schedules
    const regularSchedule = schedules.find(schedule => {
      return schedule.scheduleSlots.some(slot => {
        const scheduleStartTime = new Date(`2000/01/01 ${slot.timeFrom}`).getTime();
        const scheduleEndTime = new Date(`2000/01/01 ${slot.timeTo}`).getTime();
        const currentTime = new Date(`2000/01/01 ${time}`).getTime();
        
        return slot.days.includes(day) && 
               currentTime >= scheduleStartTime && 
               currentTime < scheduleEndTime;
      });
    });

    if (regularSchedule) return regularSchedule;

    // Then check admin hours
    const adminHourSlot = adminHours.find(slot => {
      if (slot.status !== 'approved') return false;
      
      const scheduleStartTime = new Date(`2000/01/01 ${slot.startTime}`).getTime();
      const scheduleEndTime = new Date(`2000/01/01 ${slot.endTime}`).getTime();
      const currentTime = new Date(`2000/01/01 ${time}`).getTime();
      
      return slot.day === day && 
             currentTime >= scheduleStartTime && 
             currentTime < scheduleEndTime;
    });

    return adminHourSlot ? { isAdminHours: true, slot: adminHourSlot } : null;
  };

  const getSlotForTimeAndDay = (schedule, time, day) => {
    if (!schedule) return null;
    
    if (schedule.isAdminHours) {
      return {
        timeFrom: schedule.slot.startTime,
        timeTo: schedule.slot.endTime,
        days: [schedule.slot.day]
      };
    }

    if (!schedule.scheduleSlots) return null;
    
    return schedule.scheduleSlots.find(slot => {
      const scheduleStartTime = new Date(`2000/01/01 ${slot.timeFrom}`).getTime();
      const scheduleEndTime = new Date(`2000/01/01 ${slot.timeTo}`).getTime();
      const currentTime = new Date(`2000/01/01 ${time}`).getTime();
      
      return slot.days.includes(day) && 
             currentTime >= scheduleStartTime && 
             currentTime < scheduleEndTime;
    });
  };

  const isFirstTimeSlot = (currentTime, slotTimeFrom) => {
    if (!slotTimeFrom || !currentTime) return false;
    
    const slotStartTime = new Date(`2000/01/01 ${slotTimeFrom}`).getTime();
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

  return generatePDF();
};

export default FacultySchedulePDF;
