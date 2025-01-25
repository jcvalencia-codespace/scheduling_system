import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: 'white',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 2,
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
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableCell: {
    width: '14.28%',
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  timeCell: {
    width: '14.28%',
    padding: 4,
    fontSize: 8,
    backgroundColor: '#f3f4f6',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  headerCell: {
    width: '14.28%',
    padding: 4,
    fontSize: 8,
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  scheduleCell: {
    backgroundColor: '#4285F4',
    color: 'white',
    padding: 4,
    fontSize: 8,
  },
});

const SchedulePDF = ({ activeTerm, schedules, timeSlots, weekDays, selectedSection }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>NU BALIWAG</Text>
        <Text style={styles.subtitle}>Faculty Schedule</Text>
        {activeTerm && (
          <>
            <Text style={styles.subtitle}>{activeTerm.term}</Text>
            <Text style={styles.subtitle}>SY - {activeTerm.academicYear}</Text>
          </>
        )}
        {selectedSection && (
          <Text style={styles.subtitle}>Section: {selectedSection}</Text>
        )}
      </View>

      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <Text style={styles.headerCell}>Time</Text>
          {weekDays.map((day) => (
            <Text key={day} style={styles.headerCell}>{day}</Text>
          ))}
        </View>

        {/* Table Body */}
        {timeSlots.map((time) => (
          <View key={time} style={styles.tableRow}>
            <Text style={styles.timeCell}>{time}</Text>
            {weekDays.map((day) => (
              <Text key={`${day}-${time}`} style={styles.tableCell}>
                {schedules.find(schedule => 
                  schedule.days.includes(day) && 
                  schedule.timeFrom === time &&
                  (selectedSection === '' || schedule.sectionName === selectedSection)
                )?.subjectCode || ''}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default SchedulePDF;