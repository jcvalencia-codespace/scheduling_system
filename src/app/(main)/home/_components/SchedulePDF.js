import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: 'white',
  },
  header: {
    marginBottom: 10,
    textAlign: 'center',
  },
  schoolName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  title: {
    fontSize: 10,
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 8,
    color: '#666',
    marginBottom: 1,
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    height: 16,
  },
  tableCell: {
    width: '14.28%',
    padding: 2,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    textAlign: 'center',
  },
  timeCell: {
    width: '14.28%',
    padding: 2,
    fontSize: 9,
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    textAlign: 'center',
    justifyContent: 'center',
  },
  headerCell: {
    width: '14.28%',
    padding: 3,
    fontSize: 7,
    backgroundColor: '#1a237e',
    color: 'white',
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderRightColor: '#000',
    textAlign: 'center',
    justifyContent: 'center',
  },
  scheduleCell: {
    backgroundColor: '#FFD700',
    borderBottomWidth: 0,
    height: '100%',
    padding: 2,
  },
  lastScheduleCell: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000'
  },
  scheduleContent: {
    position: 'absolute', 
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1,
  },
  scheduleText: {
    fontSize: 8,
    textAlign: 'center',
    color: '#000000',
    marginBottom: 2,
  },
  timeRangeText: {
    fontSize: 7,
    textAlign: 'center',
    color: '#000000',
    marginBottom: 3,
    fontWeight: 'bold',
  }
});

const SchedulePDF = ({ activeTerm, schedules, selectedSection }) => {
  // Filter schedules based on selectedSection
  const filteredSchedules = schedules.filter(schedule => 
    schedule.section?.sectionName === selectedSection
  );

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

  const timeSlots = generateTimeSlots();
  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const getScheduleForTimeAndDay = (time, day) => {
    return filteredSchedules.find(schedule => {
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

  const isWithinScheduleTime = (time, schedule) => {
    if (!schedule) return false;
    
    return schedule.scheduleSlots.some(slot => {
      const scheduleStartTime = new Date(`2000/01/01 ${slot.timeFrom}`).getTime();
      const scheduleEndTime = new Date(`2000/01/01 ${slot.timeTo}`).getTime();
      const currentTime = new Date(`2000/01/01 ${time}`).getTime();
      return currentTime >= scheduleStartTime && currentTime < scheduleEndTime;
    });
  };

  const isLastTimeSlot = (currentTime, slot) => {
    if (!slot || !slot.timeTo || !currentTime) return false;
    
    const slotEndTime = new Date(`2000/01/01 ${slot.timeTo}`).getTime();
    const currentTimeDate = new Date(`2000/01/01 ${currentTime}`).getTime();
    return slotEndTime === currentTimeDate;
  };

  const getScheduleDuration = (slot) => {
    if (!slot) return 0;
    const startTime = new Date(`2000/01/01 ${slot.timeFrom}`);
    const endTime = new Date(`2000/01/01 ${slot.timeTo}`);
    const diffMinutes = (endTime - startTime) / (1000 * 60);
    return (diffMinutes / 20) * 15;
  };

  const getContentForTimeSlot = (schedule, slot, time, isFirstSlot) => {
    if (!schedule || !slot) return null;

    const slotStartTime = new Date(`2000/01/01 ${slot.timeFrom}`).getTime();
    const currentTime = new Date(`2000/01/01 ${time}`).getTime();
    const timeDiff = (currentTime - slotStartTime) / (1000 * 60);
    const cellIndex = Math.floor(timeDiff / 20);

    if (isFirstSlot) {
      return (
        <View style={styles.scheduleContent}>
          <Text style={styles.timeRangeText}>
            {`${slot.timeFrom} - ${slot.timeTo}`}
          </Text>
        </View>
      );
    } else if (cellIndex === 1) {
      return (
        <View style={styles.scheduleContent}>
          <Text style={styles.scheduleText}>
            {schedule.subject?.subjectCode || ''}
          </Text>
        </View>
      );
    } else if (cellIndex === 2) {
      return (
        <View style={styles.scheduleContent}>
          <Text style={styles.scheduleText}>
            {slot.room?.roomCode || ''}
          </Text>
        </View>
      );
    } else if (cellIndex === 3) {
      return (
        <View style={styles.scheduleContent}>
          <Text style={styles.scheduleText}>
            {schedule.faculty?.lastName || ''}
          </Text>
        </View>
      );
    }
    
    return <View style={styles.scheduleContent} />;
  };

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.schoolName}>NU BALIWAG</Text>
          <Text style={styles.title}>Class Schedule</Text>
          {activeTerm && (
            <>
              <Text style={styles.subtitle}>Schedule for: {selectedSection}</Text>
              <Text style={styles.subtitle}>{activeTerm.term} - AY {activeTerm.academicYear}</Text>
            </>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.headerCell}>Time</Text>
            {weekDays.map(day => (
              <Text key={day} style={styles.headerCell}>{day}</Text>
            ))}
          </View>

          {timeSlots.map((time, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.timeCell}>{time}</Text>
              {weekDays.map(day => {
                const schedule = getScheduleForTimeAndDay(time, day);
                const slot = getSlotForTimeAndDay(schedule, time, day);
                const isFirstSlot = slot ? isFirstTimeSlot(time, slot) : false;
                const isInSchedule = isWithinScheduleTime(time, schedule);
                const isLastSlotOfSchedule = isLastTimeSlot(time, slot);

                return (
                  <View key={`${day}-${time}`} style={[
                    styles.tableCell,
                    isInSchedule && styles.scheduleCell,
                    isLastSlotOfSchedule && styles.lastScheduleCell
                  ]}>
                    {isInSchedule && getContentForTimeSlot(schedule, slot, time, isFirstSlot)}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default SchedulePDF;